let port
const connectBtn = document.getElementById("connectBtn");
const sendBtn = document.getElementById("sendBtn");

let reader;
let writer;

const inputField = document.getElementById("inputField");
const terminal = document.getElementById("terminal");
//------------------------------------------------------------


async function connectSerial() {
  try {
  
    const decoder = new TextDecoderStream();
    const encoder = new TextEncoderStream();
    
    
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });

    port.readable.pipeTo(decoder.writable);
    reader = decoder.readable.getReader();

    encoder.readable.pipeTo(port.writable);
    writer = encoder.writable.getWriter();

    log("[ Connected to cereal port ]");
    
    
    connectBtn.textContent = "Disconnect";
    inputField.disabled = false;
    sendBtn.disabled = false;

  } catch (err) {
    log("❌❌❌❌❌❌❌: " + err);
  }
}


async function sendData() {
  const data = inputField.value + "\n";
  if (writer) {
    await writer.write(data);
    log(">> " + inputField.value);
    inputField.value = "";
  }
}
//------------------------------------------------------------


connectBtn.addEventListener("click", async () => {
  if (connectBtn.textContent === "Connect") {
    await connectSerial();
  }
});

sendBtn.addEventListener("click", sendData);
inputField.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendData();
});
