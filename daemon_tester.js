const child_process = require("child_process")
const fs = require('fs');

const flutterDir = 'D:\\Frameworks\\Test\\flutter';
// const flutterDir = 'C:\\Dev\\Google\\flutter';

const dartPath = `${flutterDir}\\bin\\cache\\dart-sdk\\bin\\dart.exe`;
const toolsDir = __dirname;
const executable = `${__dirname}\\fake_flutter.bat`;
const args = [];


function safeSpawn(workingDirectory, binPath, args) {
	const simpleCommandRegex = new RegExp("^[\\w\\-.]+$");
	const quotedArgs = args.map(quoteAndEscapeArg);
	const customEnv = Object.assign({ DART_PATH: dartPath }, process.env);
	binPath = simpleCommandRegex.test(binPath) ? binPath : `"${binPath}"`;
	return child_process.spawn(binPath, quotedArgs, { cwd: workingDirectory, env: customEnv, shell: true });
}

function quoteAndEscapeArg(arg) {
	let escaped = arg.replace(/"/g, `\\"`).replace(/`/g, "\\`");
	if (process.platform.startsWith("win"))
		escaped = escaped.replace(/"([<>])/g, "\"^$1");
	return `"${escaped}"`;
}

async function main() {
	if (!fs.existsSync(dartPath)) {
		console.error(`Please set flutterDir at the top of daemon_tester.js`);
		return;
	}
	const process = safeSpawn(toolsDir, executable, args);

	await new Promise((resolve) => {
		process.stdout.on("data", (data) => { resolve(); console.log(`    <== ${data}`); });
		process.stderr.on("data", (data) => { resolve(); console.log(`        <== ERROR == ${data}`); });
		process.on("exit", (code, signal) => console.log(`exit: ${code}, ${signal}`));
		process.on("error", (data) => console.log(`        <== ERROR! == ${data}`));
	})

	function send(msg) {
		console.log(`==> ${msg}`);
		process.stdin.write(`${msg}\n`);
	}

	send('[{"id":"1","method":"device.enable"}]');
	for (var i = 2; i < 10; i++) {
		send(`[{"id":"${i}","method":"emulator.getEmulators"}]`);
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	console.log('Done!');
	send('[{"id":"999","method":"daemon.shutdown"}]');
	await new Promise((resolve) => setTimeout(resolve, 1000));
	process.kill();
}

main();
