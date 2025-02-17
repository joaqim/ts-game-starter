import { Util } from "../util";
import * as fs from "fs";
import * as path from "path";
import chokidar from 'chokidar';

const configPath = process.argv[2];
const configDirectory = path.dirname(configPath);
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const assetDirectory = path.join(configDirectory, config.assets.assetsPath);
const assetFilePath = path.join(
  configDirectory,
  config.assets.compiledAssetsFile
);

function walkDir(dir: string, callback: (path: string) => void) {
  fs.readdirSync(dir).forEach((f: string) => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();

    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function allNestedFiles(dir: string): string[] {
  let files: string[] = [];

  walkDir(dir, (path) => {
    files.push(path.slice(dir.length));
  });

  return files;
}

const isPathTiledTileMap = (path: string) => {
  try {
    const json = JSON.parse(fs.readFileSync(path, "utf8"));

    return json.version && json.tilewidth && json.type === "map";
  } catch (e) {
    return false;
  }
};

const isPathTiledWorldMap = (path: string) => {
  try {
    const json = JSON.parse(fs.readFileSync(path, "utf8"));

    return json.maps && json.type === "world";
  } catch (e) {
    return false;
  }
};

const assetExtensions = [".png", ".gif", ".mp3", ".json"];

const buildAssetsFile = () => {
  const allFiles = allNestedFiles(assetDirectory).filter((file) =>
    assetExtensions.find((ext) => file.endsWith(ext))
  );
  const normalFiles: string[] = [];
  const animationBundles: { [key: string]: string[] } = {};

  for (const file of allFiles) {
    const match = /(.+)_(\d+)\.(png|gif)$/.exec(file);

    if (match !== null) {
      const [fullString, prefix, frame, extension] = match;

      animationBundles[prefix] = animationBundles[prefix] || [];
      animationBundles[prefix][Number(frame)] = file;

      continue;
    }

    const match2 = /(.+) \((\d+)\)\.(png|gif)$/.exec(file);

    if (match2 !== null) {
      const [fullString, prefix, frame, extension] = match2;

      animationBundles[prefix] = animationBundles[prefix] || [];
      animationBundles[prefix][Number(frame)] = file;

      continue;
    }

    normalFiles.push(file);
    continue;
  }

  const allKeys = normalFiles.concat(
    Util.FlattenByOne(
      Object.keys(animationBundles).map((key) => animationBundles[key])
    )
  );

  let output = `// THIS FILE IS AUTOGENERATED from the parameters in config.json. Do not edit it.
// If you want to change something about how it's generated, look at library/asset_builder.ts.

import { TypesafeLoader } from "../library/typesafe_loader";

export type AssetType =
  | "Image"
  | "TileMap"
  | "TileWorld"
  | "Audio"
  | "Spritesheet"
  | "Animation"

export type AssetName = keyof typeof AssetsToLoad
export type AssetPath = 
${allKeys.map((key) => `  | "${key}"\n`).join("")}
${allKeys.length === 0 ? "  | void\n" : ""}

export const AssetsToLoad = {
`;

  if (allFiles.length === 0) {
    output += "  // No files found!";
    output += "}";

    return output;
  }

  const longestTruncatedFileLength = Util.MaxBy(allFiles, (x) =>
    x.lastIndexOf(".")
  )!.lastIndexOf(".");
  const longestFileLength = Util.MaxBy(allFiles, (x) => x.length)!.length;
  const longestAssetType = "'TileWorld'".length;

  for (const file of normalFiles) {
    let resourceType = "";

    if (file.endsWith(".png") || file.endsWith(".gif")) {
      resourceType = "Image";
    } else if (file.endsWith(".json")) {
      if (isPathTiledTileMap(path.join(assetDirectory, file))) {
        resourceType = "TileMap";
      } else if (isPathTiledWorldMap(path.join(assetDirectory, file))) {
        resourceType = "TileWorld";
      } else {
        continue;
      }
    } else if (file.endsWith(".mp3")) {
      resourceType = "Audio";
    }

    const fileNameWithoutExtension = file.slice(0, file.lastIndexOf("."));

    output += `  "${Util.PadString(
      fileNameWithoutExtension,
      longestTruncatedFileLength,
      '"'
    )}: { type: "${Util.PadString(
      resourceType,
      longestAssetType,
      '"'
    )} as const, path: "${Util.PadString(file, longestFileLength, '"')} },\n`;
  }

  if (Object.keys(animationBundles).length > 0) {
    output += `\n`;
    output += `  /* Animations */\n`;
    output += `\n`;

    for (const animationName of Object.keys(animationBundles)) {
      output += `  "${animationName}": {\n`;
      output += `    type: "Animation" as const,\n`;
      output += `    paths: [\n`;

      for (const frame of animationBundles[animationName]) {
        if (frame === undefined) {
          continue;
        }

        output += `      "${frame}",\n`;
      }

      output += `    ],\n`;
      output += `  },\n`;
    }
  }

  output += "};\n";
  output += "\n";
  output += "export const Assets = new TypesafeLoader(AssetsToLoad);\n";

  return output;
};

function writeAssetsFile() {
  console.log(`[${Util.FormatDate(new Date())}] Recompiling...`);
  fs.writeFileSync(assetFilePath, buildAssetsFile());
}

// This code uses chokidar.watch to monitor changes in the assetDirectory directory
// and call the writeAssetsFile function when a change is detected.
// The ignored option is used to ignore hidden files and directories.
// The persistent option is used to continue watching files even after they have been deleted.
// The Util.Debounce() function is used to debounce the changes to prevent multiple writes in a short period of time
chokidar
  .watch(assetDirectory, { ignored: /(^|[\/\\])\../, persistent: true })
  .on(
    "change",
    Util.Debounce(() => {
      writeAssetsFile();
    })
  );

writeAssetsFile();
