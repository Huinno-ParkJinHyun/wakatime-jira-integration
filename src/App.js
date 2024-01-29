// src/App.js
import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css'; // 스타일링을 위한 CSS 파일 임포트

function App() {
  const [config, setConfig] = useState(() => {
    // 페이지 로드 시 로컬 스토리지에서 설정 불러오기
    const savedConfig = localStorage.getItem('config');
    return savedConfig
      ? { today: new Date().toISOString().split('T')[0], ...JSON.parse(savedConfig) }
      : {
          today: new Date().toISOString().split('T')[0],
          wakatimeApiKey: '',
          jiraApiKey: '',
          jiraServer: '',
          jiraUsername: '',
          projects: '',
          assignDisplayName: '',
        };
  });

  // React 컴포넌트 내부
  // const [serverResponse, setServerResponse] = useState({
  //   messages: [],
  //   branchDurations: {},
  //   totalWorkTime: '',
  // });

  useEffect(() => {
    // 설정이 변경될 때마다 로컬 스토리지에 저장
    localStorage.setItem('config', JSON.stringify(config));
  }, [config]);

  const handleInputChange = e => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post('/api/save-config', config);
      alert('설정이 저장되었습니다. 매일밤 23시 50분에 자동으로 실행됩니다.');
      // const response = await axios.post('/api/submit-config', config);
      // setServerResponse({
      //   messages: response.data.messages,
      //   branchDurations: response.data.branchDurations,
      //   totalWorkTime: response.data.totalWorkTime,
      // });
    } catch (error) {
      alert('[서버에러] 콘솔창에서 에러를 확인해주세요');
      console.error('Error submitting config:', error);
    }
  };

  // const existServerResponse =
  //   serverResponse.messages.length > 0 ||
  //   Object.keys(serverResponse.branchDurations).length > 0 ||
  //   serverResponse.totalWorkTime;

  return (
    <div className="container">
      <h1>작업시간 측정기</h1>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>조회하고 싶은 날짜</label>
          <input type="text" name="today" value={config.today} onChange={handleInputChange} required />

          <label>WakaTime API Key</label>
          <input
            type="text"
            name="wakatimeApiKey"
            value={config.wakatimeApiKey}
            onChange={handleInputChange}
            required
          />
          <label>Jira API Key</label>
          <input type="text" name="jiraApiKey" value={config.jiraApiKey} onChange={handleInputChange} required />

          <label>Jira Server</label>
          <input type="text" name="jiraServer" value={config.jiraServer} onChange={handleInputChange} required />

          <label>Jira User name</label>
          <input type="text" name="jiraUsername" value={config.jiraUsername} onChange={handleInputChange} required />

          <label>Projects</label>
          <input type="text" name="projects" value={config.projects} onChange={handleInputChange} required />

          <label>Assign Display Name</label>
          <input
            type="text"
            name="assignDisplayName"
            value={config.assignDisplayName}
            onChange={handleInputChange}
            required
          />
        </div>
        <button type="submit" className="submit-button">
          Submit
        </button>
      </form>

      {/* {existServerResponse && (
        <div>
          <h2>Server Response</h2>
          <div>
            <h3>Messages:</h3>
            <ul>
              {serverResponse.messages.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Branch Durations:</h3>
            <ul>
              {Object.entries(serverResponse.branchDurations).map(([branch, duration]) => (
                <li key={branch}>{`${branch}: ${duration} seconds`}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Total Work Time:</h3>
            <p>{serverResponse.totalWorkTime}</p>
          </div>
        </div>
      )} */}
    </div>
  );
}

export default App;
