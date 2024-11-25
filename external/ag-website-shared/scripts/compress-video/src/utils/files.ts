import * as fs from 'fs/promises';
import * as path from 'path';

export async function exists(filePath: string) {
    try {
        return (await fs.stat(filePath))?.isFile();
    } catch {
        return false;
    }
}

export function ensureDirectory(dirPath: string) {
    return fs.mkdir(dirPath, { recursive: true });
}

export function getFileExtension(file: string) {
    return path.parse(file).ext;
}

export function getFilePathBaseName(filePath: string) {
    return path.parse(filePath).base;
}

export async function getFolderFiles(folder: string) {
    return fs.readdir(folder);
}

export async function readFile(filePath: string) {
    return (await fs.readFile(filePath)).toString();
}

export async function writeFile(filePath: string, newContent: string | Buffer) {
    await ensureDirectory(path.dirname(filePath));
    return fs.writeFile(filePath, newContent);
}

export function copyFiles(from: string, to: string, filter: (src: string, dest: string) => boolean = () => true) {
    return fs.cp(from, to, { recursive: true, filter });
}

export async function deleteFile(filePath: string) {
    return await fs.unlink(filePath);
}

/**
 * Get file size (in MB)
 */
export async function fileSize(filePath: string) {
    const stats = await fs.stat(filePath);
    const sizeMB = stats.size / (1024 * 1024);

    return sizeMB.toFixed(2) + 'MB';
}

export async function getFilePathsRecursively(dir: string, allFiles: string[] = []) {
    allFiles = allFiles || [];
    const files = await fs.readdir(dir);

    await Promise.all(
        files.map(async (file) => {
            const name = path.join(dir, file);

            const isDirectory = (await fs.stat(name)).isDirectory();

            allFiles.push(name);

            if (isDirectory) {
                await getFilePathsRecursively(name, allFiles);
            }
        })
    );

    return allFiles;
}
