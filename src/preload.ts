import { contextBridge } from 'electron'
import rendererApi from './preload/api'

contextBridge.exposeInMainWorld('electronAPI', rendererApi)
