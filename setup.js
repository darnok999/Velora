const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const questions = [
  'Gib deinen Bot-Namen ein: ',
  'Gib dein OAuth-Token ein: ',
  'Gib den Kanalnamen ein, in dem der Bot aktiv sein soll: ',
  'Gib deine Client-ID ein: ',
  'Gib deinen OpenAI API-Key ein: '
];

const answers = [];

const askQuestion = (index) => {
  if (index === questions.length) {
    const envContent = `
TWITCH_BOT_USERNAME=${answers[0]}
TWITCH_ACCESS_TOKEN=${answers[1]}
TWITCH_CHANNEL=${answers[2]}
TWITCH_CLIENT_ID=${answers[3]}
OPENAI_API_KEY=${answers[4]}
`;
    fs.writeFileSync('.env', envContent.trim());
    console.log('.env-Datei wurde erstellt. Du kannst jetzt den Bot starten.');
    rl.close();
    return;
  }
  rl.question(questions[index], (answer) => {
    answers.push(answer);
    askQuestion(index + 1);
  });
};

askQuestion(0); 