import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image, CheckCircle } from 'lucide-react'
import { cn, formatFileSize } from '../../utils/helpers'

export default function FileDropzone({
  label,
  hint,
  accept = { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
  maxFiles = 1,
  maxSize = 10 * 1024 * 1024,
  files = [],
  onFilesChange,
  error,
}) {
  const isMulti = maxFiles > 1

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) return
    if (isMulti) {
      onFilesChange([...files, ...accepted].slice(0, maxFiles))
    } else {
      onFilesChange(accepted.slice(0, 1))
    }
  }, [files, isMulti, maxFiles, onFilesChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: isMulti ? maxFiles : 1,
    maxSize,
    multiple: isMulti,
  })

  const removeFile = (idx) => {
    onFilesChange(files.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-[#2C2C2C]">
          {label}
        </label>
      )}

      {/* Drop zone — hide when single-file mode has a file */}
      {(isMulti || files.length === 0) && (
        <div
          {...getRootProps()}
          className={cn(
            'upload-zone',
            isDragActive && 'upload-zone-active',
            error && 'border-coral-400 bg-coral-50'
          )}
        >
          <input {...getInputProps()} />
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            isDragActive ? 'bg-teal-100' : 'bg-slate-100'
          )}>
            <Upload className={cn('w-6 h-6', isDragActive ? 'text-teal-600' : 'text-slate-500')} />
          </div>

          {isDragActive ? (
            <p className="text-sm font-medium text-teal-600">Drop here to upload</p>
          ) : (
            <>
              <p className="text-sm font-medium text-[#2C2C2C]">
                Drag & drop, or <span className="text-teal-600 underline">browse</span>
              </p>
              {hint && <p className="text-xs text-[#6B7280]">{hint}</p>}
              <p className="text-xs text-[#9CA3AF]">
                Max {formatFileSize(maxSize)}{isMulti ? ` · Up to ${maxFiles} files` : ''}
              </p>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-coral-600 flex items-center gap-1">
          <X className="w-3 h-3" /> {error}
        </p>
      )}

      {/* File previews */}
      {files.length > 0 && (
        <div className={cn('space-y-2', isMulti && 'max-h-48 overflow-y-auto')}>
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-teal-50 border border-teal-200"
            >
              {/* Thumbnail */}
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-5 h-5 text-slate-400" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#2C2C2C] truncate">{file.name}</p>
                <p className="text-xs text-[#6B7280]">{formatFileSize(file.size)}</p>
              </div>

              <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0" />

              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="p-1 rounded hover:bg-teal-100 transition-colors flex-shrink-0"
                aria-label="Remove file"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
