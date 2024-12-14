const tmi = require('tmi.js');
const axios = require('axios');
require('dotenv').config(); // Lädt die .env-Datei

// Debugging: Überprüfen, ob der OpenAI API-Key korrekt geladen wird
console.log('OpenAI API Key:', process.env.OPENAI_API_KEY);  // Überprüft, ob der API-Schlüssel korrekt geladen wird

// Bot-Optionen
const opts = {
  identity: {
    username: process.env.TWITCH_BOT_USERNAME,  // Dein Bot-Name
    password: process.env.TWITCH_ACCESS_TOKEN,  // Dein OAuth-Token
  },
  channels: [ process.env.TWITCH_CHANNEL ]  // Der Kanalname
};

// Erstelle den Bot-Client
const client = new tmi.client(opts);

// Verbinde den Bot mit dem Twitch-Chat
client.connect();

// Überprüfe, ob der Bot mit Twitch verbunden ist
client.on('connected', (address, port) => {
  console.log(`Bot verbunden mit ${address}:${port}`);
});

// Funktion zum Abrufen der broadcaster_id
async function getBroadcasterId(channel) {
  try {
    const response = await axios.get('https://api.twitch.tv/helix/users', {
      params: {
        login: channel // Kanalname dynamisch verwenden
      },
      headers: {
        'Authorization': `Bearer ${process.env.TWITCH_ACCESS_TOKEN}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID
      }
    });

    const broadcasterId = response.data.data[0].id;
    console.log(`Kanal-ID für ${channel}: ${broadcasterId}`);
    return broadcasterId;
  } catch (error) {
    console.error('Fehler beim Abrufen der Kanal-ID:', error);
    return null; // Rückgabe null im Fehlerfall
  }
}

// Auf Nachrichten reagieren
client.on('message', async (channel, userstate, message, self) => {
  if(self) return;  // Verhindert, dass der Bot auf eigene Nachrichten reagiert

  console.log(`Nachricht empfangen: ${message}`);  // Debugging: Zeigt die empfangene Nachricht an

  // Wenn der Bot auf eine Nachricht antworten soll
  if (message.toLowerCase().startsWith('!velora')) {  // Ändere den Befehl auf '!velora'
    const userMessage = message.slice(8).trim();  // Entfernt '!velora' vom Anfang der Nachricht

    try {
      const broadcasterId = await getBroadcasterId(channel); // Hole die broadcaster_id

      // Wenn keine gültige broadcaster_id zurückgegeben wird, beende den Vorgang
      if (!broadcasterId) {
        client.say(channel, `@${userstate.username} Entschuldigung, ich konnte den Kanal nicht finden.`);
        return;
      }

      console.log('Sende Anfrage an OpenAI:', userMessage); // Debugging: Was wird an OpenAI gesendet

      // Sende Anfrage an die OpenAI API (GPT-3.5)
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions', // Endpunkt angepasst
        {
          model: 'gpt-3.5-turbo', // Verwende das GPT-3.5 Modell
          messages: [{ role: 'user', content: userMessage }],  // Neues Format für Chat-Modelle
          max_tokens: 100,  // Die maximale Länge der Antwort
          temperature: 0.7  // Bestimmt die Kreativität der Antwort
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Debugging: Zeigt die vollständige Antwort von OpenAI an
      console.log('Antwort von OpenAI:', response.data);

      // Überprüfe, ob die Antwort erfolgreich ist und eine Wahl vorhanden ist
      if (response.data.choices && response.data.choices[0]) {
        const chatGptResponse = response.data.choices[0].message.content.trim();
        console.log('ChatGPT Antwort:', chatGptResponse); // Zeigt die generierte Antwort an
        client.say(channel, chatGptResponse); // Antwort im Twitch-Chat senden
      } else {
        client.say(channel, `@${userstate.username} Entschuldigung, ich konnte keine Antwort generieren.`);
      }
    } catch (error) {
      console.error('Fehler bei der Anfrage an OpenAI:', error.response ? error.response.data : error.message);
      client.say(channel, `@${userstate.username} Entschuldigung, ich konnte keine Antwort generieren.`);
    }
  }
});
