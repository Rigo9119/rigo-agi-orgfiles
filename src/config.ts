const orgfilesPath = process.env.ORGFILES_PATH;

if (!orgfilesPath) {
  throw new Error("ORGFILES_PATH is not set. Add it to your .env file.");
}

export const ORGFILES_PATH: string = orgfilesPath;
