# Wakatime Jira Auto-Integration

This is a program that uses the Wakatime API to automatically log work hours to Jira tickets.

It was created for internal use, so detailed usage instructions are not provided.

I plan to open-source it later by converting it to a GitHub Action.

## How to Use

1. Clone the repository:

```shell
git clone https://github.com/Huinno-ParkJinHyun/wakatime-jira-integration.git
```

2. Navigate to the project directory:

```shell
cd wakatime-jira-integration
```

3. Install dependencies:

```shell
npm install
```

4. Start the application:

```shell
npm run start
```

5. Start the server:

```shell
node server.js
```

6. When prompted, enter your system (macOS lock screen) password in the terminal.

7. Open the provided URL in your web browser and enter the required environment variables. (base : localhost:3000)

8. Click the "Submit" button.

9. If you see a success message, the program will automatically log work hours to Jira tickets at 23:50 every day.

## Conditions for Automatic Updates

1. The battery must have sufficient charge at 23:50 (not in power-saving mode).
2. The Mac should not be completely turned off at 23:50.

## API Tokens

- Wakatime API: [Get it here](https://wakatime.com/settings/account)
- Jira API Token: [Get it here](https://id.atlassian.com/manage-profile/security/api-tokens)

---

# Wakatime Jira Auto-Integration

이 프로그램은 Wakatime API를 사용하여 작업 시간을 자동으로 Jira 티켓에 로깅하는 프로그램입니다.

이 프로그램은 사내 사용을 목적으로 만들어졌으므로 자세한 사용 방법은 제공되지 않습니다.

나중에 이것을 GitHub Action으로 변환하여 오픈 소스화할 계획입니다.

## 사용 방법

1. 리포지토리를 복제합니다:

```shell
git clone https://github.com/Huinno-ParkJinHyun/wakatime-jira-integration.git
```

2. 프로젝트 디렉토리로 이동합니다:

```shell
cd wakatime-jira-integration
```

3. 의존성을 설치합니다:

```shell
npm install
```

4. 애플리케이션을 시작합니다:

```shell
npm run start
```

6. 터미널에서 요청 시 `시스템 비밀번호(맥 잠금 화면)`를 입력합니다.

7. 웹 브라우저에서 제공된 URL을 열고 필요한 환경 변수를 입력합니다. (base : localhost:3000)

8. "submit" 버튼을 클릭합니다.

9. 성공 메시지가 표시되면 프로그램이 매일 23:50에 자동으로 Jira 티켓에 작업 시간을 로깅합니다.

## 자동 업데이트 조건

1. 23:50에 배터리 충전이 충분해야 합니다(절전 모드 아님).
2. 23:50에 맥이 완전히 꺼져 있으면 안됩니다.

## API 토큰

- Wakatime API: [여기에서 가져오기](https://wakatime.com/settings/account)
- Jira API 토큰: [여기에서 가져오기](https://id.atlassian.com/manage-profile/security/api-tokens)
