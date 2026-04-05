/**
 * Tipos mínimos para a File System Access API (Chrome).
 * @see https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
 */

export type FilePickerAcceptType = {
  description?: string
  accept: Record<string, string[]>
}

export type OpenFilePickerOptions = {
  multiple?: boolean
  excludeAcceptAllOption?: boolean
  types?: FilePickerAcceptType[]
}

export type SaveFilePickerOptions = {
  excludeAcceptAllOption?: boolean
  suggestedName?: string
  types?: FilePickerAcceptType[]
}

declare global {
  interface Window {
    showOpenFilePicker(
      options?: OpenFilePickerOptions,
    ): Promise<FileSystemFileHandle[]>
    showSaveFilePicker(
      options?: SaveFilePickerOptions,
    ): Promise<FileSystemFileHandle>
  }
}

export {}
