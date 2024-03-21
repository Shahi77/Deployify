const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");

const s3Client = new S3Client({
  reqion: "",
  credentials: {
    accessKeyId: "",
    secretAccessKey: "",
  },
});

const PROJECT_ID = process.env.PROJECT_ID;
async function init() {
  console.log("Executing script.js");
  const outDirPath = path.join(__dirname, "output");
  const p = exec(`cd ${outDirPath} && npm install && npm run build`);

  p.stdout.on("data", function (data) {
    console.log(data.toString());
  });
  p.stdout.on("error", function (data) {
    console.log("Error", data.toString());
  });
  p.on("close", async function () {
    console.log("Build complete");
    const distFolderPath = path.join(__dirname, "output", "dist");
    const distFolderContents = fs.readdirSync(distFolderPath, {
      recursive: true,
    });
    for (const filePath of distFolderContents) {
      if (fs.lstatSync(filePath).isDirectory()) continue;

      const command = new PutObjectCommand({
        Bucket: "",
        key: `--outputs/${PROJECT_ID}/${filePath}`,
        Body: fs.createReadStream(filePath),
        contentType: mime.lookup(filePath),
      });

      await s3Client.send(command);
    }
    console.log("Done...");
  });
}
