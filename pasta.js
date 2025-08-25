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
let timestampMode = true;   // timestamp toggle

let outputBuffer = ""; // for save btn
let rawMode = false;   // raw toggle - old ver

const terminal = document.getElementById("terminal");
const connectBtn = document.getElementById("connectBtn");
const sendBtn = document.getElementById("sendBtn");
const inputField = document.getElementById("inputField");
const baudRateSelect = document.getElementById("baudRate");

// footer btns
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn");
const rawToggle = document.getElementById("rawToggle"); // depre
const portInfo = document.getElementById("portInfo");   // show vendor/product id if possible

const timestampToggle = document.getElementById("timestampToggle");
timestampToggle.checked = timestampMode; // default on
//--------------------------------------


function printToTerminal(text, isSystem = false) {
  const line = document.createElement("div");

  // timestamp
  let ts = "";
  const now = new Date();

  if (timestampMode) {
    //ts = "[" + new Date().toLocaleTimeString() + "] ";
    ts = now.toLocaleTimeString("en-US", { hour12: false }) + "." + String(now.getMilliseconds()).padStart(3, "0");

  }

  line.textContent = ts + " " + text;

  //line.className = isSystem ? "text-gray-500" : "text-green-300"; // swap
  line.className = isSystem ? "text-green-500" : "text-gray-300"; // swap
  
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight; // auto scrol

  // op buffer
  outputBuffer += line.textContent + "\n";
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
      // clear "not connected" text
      clearBtn.click();
      // web serial api doest give tthe system port name 
      const info = port.getInfo ? port.getInfo() : {};
      printToTerminal(`[ (${JSON.stringify(info) || "Port connected"}) ]`, true);
      printToTerminal(`[ C0nnected @ ${baudRateSelect.value} baud ]`, true);

      // update header port info
      if (info.usbVendorId) {
        portInfo.textContent = `VID: ${info.usbVendorId}, PID: ${info.usbProductId}`;
      } else {
        portInfo.textContent = "(Port connected)";
      }

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
  portInfo.textContent = ""; // clear header info
  printToTerminal("[ Disc0nnected ]", true);
}

// rx
async function readLoop() {
  while (keepReading && reader) {
    try {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        buffer += value; // load  buffer
        if (rawMode) {
          printToTerminal(buffer); // dump buffer - raw depre
          buffer = "";
        } else {
          let lines = buffer.split(/\r?\n/); // Split lines
          buffer = lines.pop(); // Save last incomplete line
          for (let line of lines) {
            printToTerminal("> " + line.trim());
          }
        }
      }
    } catch (err) {
      printToTerminal(`[ Read errror: ${err.message} ]`, true);
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

//------------------------------------------------------

// clear 
clearBtn.addEventListener("click", () => {
  terminal.innerHTML = "";
  outputBuffer = "";
  printToTerminal("[ Cleared ]", true);
});

// save / dwnld
saveBtn.addEventListener("click", () => {
  const blob = new Blob([outputBuffer], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const now_s = new Date();
  const timestamp = now_s.toLocaleTimeString("en-US", { hour12: false }) + "." + String(now_s.getMilliseconds()).padStart(3, "0");
  a.download = "termicelli_out_" + timestamp + ".txt";
  a.click();
  URL.revokeObjectURL(url);
});

// raw mode - depre
if (rawToggle) {
  rawToggle.addEventListener("change", () => {
    rawMode = rawToggle.checked;
    printToTerminal(`[ Raw mode ${rawMode ? "ON" : "OFF"} ]`, true);
  });
}

// timestamp ts toggle
if (timestampToggle) {
  timestampToggle.addEventListener("change", () => {
    timestampMode = timestampToggle.checked;
    printToTerminal(`[ Timestamp ${timestampMode ? "ON" : "OFF"} ]`, true);
  });
}
