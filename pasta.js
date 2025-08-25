let port;
let reader;
let writer;
// enc dec 
let textDecoder;
let textEncoder;
let keepReading = false;
let buffer = ""; 
// ad  string buffer compensate \n\r
let buffer2 = "";

const terminal = document.getElementById("terminal");
const connectBtn = document.getElementById("connectBtn");
const sendBtn = document.getElementById("sendBtn");
const inputField = document.getElementById("inputField");
const baudRateSelect = document.getElementById("baudRate");


function printToTerminal(text, isSystem = false) {
  const line = document.createElement("div");
  line.textContent = text;
  //line.className = isSystem ? "text-gray-500" : "text-green-300"; // swap
  line.className = isSystem ? "text-green-500" : "text-gray-300"; // swap
  
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight; // auto scrol
}

//------------------------------------------------------

connectBtn.addEventListener("click", async () => {
  if (!port) {
    try {
      port = await navigator.serial.requestPort();
      await port.open({
        baudRate: parseInt(baudRateSelect.value, 10),
      });

      textDecoder = new TextDecoderStream();
      textEncoder = new TextEncoderStream();

      // stream pipe s
      port.readable.pipeTo(textDecoder.writable);
      textEncoder.readable.pipeTo(port.writable);

      reader = textDecoder.readable.getReader();
      writer = textEncoder.writable.getWriter();

      keepReading = true;
      readLoop();

      printToTerminal(`[ C0nnected @ ${baudRateSelect.value} baud ]`, true);
      connectBtn.textContent = "Disconnect";
      inputField.disabled = false;
      sendBtn.disabled = false;

    } catch (err) {
      printToTerminal(`[ Error: ${err.message} ]`, true);
    }
  } else {
    disconnect();
  }
});

// release
async function disconnect() {
  keepReading = false;
  if (reader) {
    await reader.cancel();
    reader.releaseLock();
  }
  if (writer) writer.releaseLock();
  if (port) await port.close();

  port = null;
  connectBtn.textContent = "Connect";
  inputField.disabled = true;
  sendBtn.disabled = true;
  printToTerminal("[ Disc0nnected ]", true);
}

// rx
async function readLoop() {
  while (keepReading && reader) {
    try {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        buffer += value; // Collect chunks
        let lines = buffer.split(/\r?\n/); // Split into lines
        buffer = lines.pop(); // Save last incomplete line
        for (let line of lines) {
          printToTerminal("> " + line.trim());
        }
      }
    } catch (err) {
      printToTerminal(`[ Read error: ${err.message} ]`, true);
      break;
    }
  }
}

//------------------------------------------------------
sendBtn.addEventListener("click", async () => {
  const command = inputField.value.trim();
  if (command && writer) {
    await writer.write(command + "\n");
    printToTerminal("> " + command);
    inputField.value = "";
  }
inputField.focus();
});
// click enter send command
inputField.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
        sendBtn.click();
    }
    
});