wakatime API를 사용해서
Jira ticket에 작업시간을 자동으로 로깅해주는 프로그램입니다.

사내에서 사용하기위해 만들었기 때문에 자세한 사용방법은 적지 않았습니다.

나중에 깃허브 액션으로 변환해서 오픈소스화 할 예정입니다.

1. git clone https://github.com/Huinno-ParkJinHyun/wakatime-jira-integration.git
2. cd wakatime-jira-integration
3. npm install
4. npm run start
5. node server.js
6. 터미널에 password: 입력란이 뜨면 시스템 (맥 잠금화면 열때 쓰는)비밀번호 입력하기
7. 열린 페이지에 각 환경변수 기입
8. submit 버튼 누르기!
9. 성공메시지가 뜬다면, 23시 50분에 자동으로 Jira의 작업했던 브랜치의 Ticket에 자동으로 작업시간 기록됨.

자동업데이트가 되는 조건

1. 23시 50분에 배터리가 충분히 있어야함 (절전모드가 아니여야함)
2. 23시 50분에 Mac이 완전히 꺼져 있으면 안됨
