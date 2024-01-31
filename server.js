const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const JiraClient = require('jira-connector');
const app = express();
const port = 3001;
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const cron = require('node-cron');
const axios = require('axios');
const { exec } = require('child_process');
const sendmail = require('sendmail')();

const settingPath = path.join(__dirname, 'setting');

const cronJobTime = '50 23 * * *'; // 매일 23시 50분에 실행되는 작업
const projectKey = 'mc';

app.use(bodyParser.json());

app.post('/api/save-config', (req, res) => {
  const configData = req.body;
  delete req.body?.today;
  const { projects } = configData;
  const projectArray = projects.replace(/\s/g, '').split(',');

  for (const project of projectArray) {
    if (!fs.existsSync(settingPath)) {
      fs.mkdirSync(settingPath);
    }

    fs.writeFile(`setting/${project}.json`, JSON.stringify({ ...configData, project }), 'utf8', err => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error saving configuration');
      }
    });
  }

  res.send('Configuration saved successfully');
});

app.post('/api/submit-config', async (req, res) => {
  const { today, wakatimeApiKey, jiraApiKey, jiraServer, jiraUsername, project, assignDisplayName } = req.body;

  // Jira 클라이언트 설정
  const jira = new JiraClient({
    host: jiraServer,
    basic_auth: {
      username: jiraUsername,
      password: jiraApiKey,
    },
  });

  const TODAY = today ?? getCurrentDateInKorea().toISOString().split('T')[0];
  const branchDurations = {};

  try {
    // WakaTime API에서 데이터 가져오기
    const wakatimeResponse = await fetch(
      `https://wakatime.com/api/v1/users/current/durations?date=${TODAY}&project=${project}&api_key=${wakatimeApiKey}`
    );

    if (!wakatimeResponse.ok) {
      throw new Error('Failed to fetch from WakaTime API');
    }

    const wakatimeData = await wakatimeResponse.json();

    // 데이터 처리 로직
    for (const work of wakatimeData.data) {
      if (work.branch) {
        const projectMatchKey = new RegExp(`\\/${projectKey}-(\\d+)`, 'i');
        const match = work.branch.match(projectMatchKey);
        if (match) {
          const ticketNumber = match[0];
          if (!branchDurations[ticketNumber]) {
            branchDurations[ticketNumber] = 0;
          }
          branchDurations[ticketNumber] += work.duration;
        }
      }
    }

    let messages = [];
    // Jira API를 사용하여 시간 로그 기록
    for (const ticketNumber in branchDurations) {
      const totalDuration = Math.round(branchDurations[ticketNumber] / 60);
      const ticket = await jira.issue.getIssue({ issueKey: ticketNumber });

      if (ticket.fields.assignee && ticket.fields.assignee.displayName !== assignDisplayName) {
        messages.push(
          `Assignee is not ${assignDisplayName} for ticket ${ticket.key}, ${ticket.fields.assignee.displayName} is assigned.`
        );
        continue;
      }
      await jira.issue.addWorkLog({
        issueKey: ticket.key,
        worklog: {
          timeSpent: `${totalDuration}m`,
        },
      });

      messages.push(`${ticket.key} : ${totalDuration}m`);
    }

    const totalWorkTime = Math.round(Object.values(branchDurations).reduce((a, b) => a + b, 0) / 60) + 'm';
    const assigneeMessages = messages.filter(msg => msg.startsWith('Assignee is not'));

    res.json({
      messages,
      branchDurations,
      totalWorkTime,
    });

    onWorkCompleted(branchDurations, totalWorkTime, project, assigneeMessages, jiraUsername);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`${port} 에서 서버 실행중`);
});

// utils
const logFilePath = project => path.join(__dirname, `log/${project}.log`);

function appendLog(message, project, jiraUsername) {
  const logDirectory = path.join(__dirname, 'log');
  if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
  }

  const timestamp = getCurrentDateInKorea().toISOString();
  const logMessage = `\n${message}\n${timestamp}\n`;

  fs.appendFile(logFilePath(project), logMessage, err => {
    if (err) {
      return console.error('Error appending to log file:', err);
    }

    sendmail(
      {
        from: 'todaysWorkTime@today.com',
        to: jiraUsername,
        subject: `${project} 작업시간 기록 완료`,
        html: message,
      },
      function (err, reply) {
        // console.log(err && err.stack);
        // console.dir(reply);
      }
    );
  });
}

function onWorkCompleted(branchDurations, totalWorkTime, project, assigneeMessages, jiraUsername) {
  const timestamp = getCurrentDateInKorea().toISOString().split('T')[0]; // YYYY-MM-DD 형식
  const logMessages = [`오늘 ${timestamp}`];

  assigneeMessages.forEach(message => logMessages.push(message)); // Assignee가 다른 티켓 로깅

  // 브랜치별 작업시간 로깅
  for (const [branch, duration] of Object.entries(branchDurations)) {
    const ticketNumber = branch.replace(`/${projectKey}-`, `${projectKey.toUpperCase()}-`); //ex, '/mc-XXXX' -> 'MC-XXXX'로 변환
    const durationInMinutes = Math.round(duration / 60); // 초를 분으로 변환
    logMessages.push(`${ticketNumber} : ${durationInMinutes}m`);
  }

  // 각 브랜치별 작업시간 (초단위)
  logMessages.push(`각 브랜치별 작업시간 (초단위) ${JSON.stringify(branchDurations)}`);

  // 총 작업시간 로깅
  logMessages.push(`오늘 총 작업시간 (분단위): ${totalWorkTime}`);

  // 로그 파일에 추가
  appendLog(logMessages.join('<br/>'), project, jiraUsername);
}

function getCurrentDateInKorea() {
  const date = new Date();
  const koreaTimeOffset = 9 * 60 * 60000; // 9시간을 밀리초로 변환
  const koreaDate = new Date(date.getTime() + koreaTimeOffset);
  return koreaDate;
}

/** Cron 작업 */
// 매일 밤 11시 50분에 실행되는 작업
async function loadConfigFiles() {
  try {
    if (!fs.existsSync(settingPath)) {
      fs.mkdirSync(settingPath);
    }
    const files = await fsPromises.readdir(settingPath);
    const configFiles = files.filter(file => file.endsWith('.json'));
    return Promise.all(configFiles.map(file => fsPromises.readFile(path.join(settingPath, file), 'utf8')));
  } catch (error) {
    console.error('Error reading config files:', error);
    throw error;
  }
}

async function submitConfig(configData) {
  try {
    const response = await axios.post('http://localhost:3001/api/submit-config', JSON.parse(configData));
    console.log('API request successful for config:', response.data);
  } catch (error) {
    console.error('Error submitting config:', error);
  }
}

cron.schedule(cronJobTime, async () => {
  try {
    const configFiles = await loadConfigFiles();

    if (configFiles.length === 0) {
      console.log('No config files found , 설정파일이 존재하지 않습니다.');
      console.log('터미널에서 "npm run start" 를 입력하고 , 설정을 저장해주세요.');
      return;
    }

    configFiles.forEach(async configData => submitConfig(configData));
    console.log('Scheduled task completed');
  } catch (error) {
    console.error('Error in scheduled task:', error);
  }
});

// pmset
exec(
  `sudo pmset repeat wakeorpoweron MTWRF ${subtractSecondsFromCronJobTime(cronJobTime, 5)}`,
  (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    // 명령 실행 완료 후 메시지 출력
    console.log('비밀번호 입력 완료');
    console.log(
      `이 서버가 꺼지지 않는다면 매일 ${convertCronJobTimeToFormattedTime(cronJobTime)} 에 작업시간 로깅이 진행됩니다.`
    );
  }
);

function subtractSecondsFromCronJobTime(cronJobTime, secondsToSubtract) {
  const hhmmss = convertCronJobTimeToFormattedTime(cronJobTime);

  // 시간 문자열을 파싱하여 시, 분, 초를 추출
  const [oldHours, oldMinutes, oldSeconds] = hhmmss.split(':').map(Number);

  // 총 초로 계산
  const totalSeconds = oldHours * 3600 + oldMinutes * 60 + oldSeconds;

  // 뺄 초를 적용하고 음수가 되지 않도록 조정
  const newTotalSeconds = Math.max(totalSeconds - secondsToSubtract, 0);

  // 시, 분, 초로 다시 변환
  const newHours = Math.floor(newTotalSeconds / 3600);
  const remainingSeconds = newTotalSeconds % 3600;
  const newMinutes = Math.floor(remainingSeconds / 60);
  const newSeconds = remainingSeconds % 60;

  // 결과를 'hh:mm:ss' 형식으로 반환
  const newTimeString = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}:${newSeconds
    .toString()
    .padStart(2, '0')}`;

  return newTimeString;
}

function convertCronJobTimeToFormattedTime(cronTime) {
  // Cron 시간을 분과 시간으로 분할
  const [minutes, hours] = cronTime.split(' ');

  // 시간과 분을 가져와서 "00:00:00" 형식으로 변환
  const hhmmss = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;

  return hhmmss;
}
/**
 * 필요한 리팩토링
 * 1. pmset이 보장되어 있는 것은 아니기 때문에, github action에서  Cronjob을 실행하도록 변경
 * 2. 그러면 프론트랑 서버 왜 만들었냐?? 아..
 */
