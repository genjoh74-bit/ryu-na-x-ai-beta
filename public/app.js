const messages = document.getElementById("messages");
const history = document.getElementById("history");

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = sender;
  div.innerText = text;
  messages.appendChild(div);
}

function addHistory(text) {
  const div = document.createElement("div");
  div.innerText = text;
  history.appendChild(div);
}

async function send() {

  const text = input.value;
  if (!text) return;

  addMessage("YOU: " + text, "user");
  addHistory(text);

  input.value = "";

  const r = await fetch("/api/ai?prompt=" + encodeURIComponent(text));
  const data = await r.json();

  const reply = data?.data?.parts?.[0]?.text || "Error";

  addMessage("RYU-NA X: " + reply, "ai");
}
