# Root Screen Recorder

A teal, Inter interface for private recording on Windows 11. Runs on your PC using Node.js and Edge or Chrome. No accounts, uploads to cloud services, watermarks, or duration quotas.

## Run

### Desktop app

Root opens to **Your videos**, a local library with thumbnail cards, search, format filtering, and sorting. Use **New video → Record a video** for the right-hand recording panel, or **New video → Import a video** to edit an existing file. Click a video card to open the editor; **Back to your videos** returns to the library. The existing single sidebar link is retained. Files remain in their saved locations, and thumbnails are cached under `.thumbnails/` in the app folder.

Click a card title to rename it inline; Enter or clicking away saves, while Escape cancels. The three-dot menu offers Rename, Download, and Delete. Blank names use `YYYY-MM-DD HH:mm:ss` in Bangladesh time. Rename changes the displayed title and download name while keeping the internal file path stable. Delete moves the video to `.root-trash/` inside its save folder; use Undo in the notice to restore it. Deleted files remain recoverable on disk and are not permanently erased. Additional downloaded copies remain in their download locations.

The details-page title is the same saved name shown on its homepage card. Click either title to edit; both views synchronize after a successful save. The details-page back link, Recording studio heading, and editing/export toolbar remain sticky at the top while scrolling.

Double-click **Root Screen Recorder** on your Windows desktop, or run **Root.exe** in this folder. The launcher starts the local server silently and opens a dedicated Edge or Chrome app window. Node.js and processing tools are bundled in this folder; keep the folder contents together. Existing recordings remain under `recordings/`. The local service stays available in the background after closing the window and stops when Windows restarts. Reopening the shortcut reuses it.

The executable is a Windows launcher around the local recorder, using your installed Edge or Chrome for its interface. It is not a signed installer. To remove it, delete the desktop shortcut and this folder after saving any recordings you want to keep.

### Command launcher and first-time setup

1. Install Node.js 22 or newer if needed (the launcher also recognizes the bundled Codex runtime).
2. Double-click **Setup.cmd** once. Internet is needed to download FFmpeg, whisper.cpp, the English speech model (~148 MB), and Inter. Downloads come from Gyan, GitHub, and Hugging Face. These tools retain their upstream licenses; see the included license files in their archives. Inter is licensed under SIL OFL.
3. Double-click **Start.cmd**. Open **http://localhost:4783** in Edge or Chrome. Keep the server terminal open.
4. Choose a screen, window, or browser tab in the Windows browser picker. Enable Share audio if offered. Set microphone and webcam, then press Start recording.
5. Stop to review, generate English captions locally, draw blur rectangles, and export MP4.

Captions are editable SRT sidecars; they are not burned into the MP4. Download them alongside the video. Multiple blur areas apply to the entire video. Blur preview uses browser blur, while final export uses FFmpeg box blur; review the exported MP4 before sharing sensitive information.

Microphone and computer audio toggle independently during recording. Webcam can be enabled or disabled during recording. Computer sound availability depends on the chosen browser and capture source. The browser must share an audio track before recording; a missing track cannot be added during capture. Selecting a new source requires stopping and reselecting. Webcam is composited in the lower right.

## Local data and practical limits

### Import an existing video

The details view places **Audio & camera**, **Save video**, and **Export MP4** on the right of its sticky toolbar. Switch between **Captions** and **Blur** tabs in the right-hand editing panel; the video and tools share the content area in a 2:1 ratio. Use the arrow keys to switch tabs from the keyboard. The export arrow offers **1080p Full HD** (up to 1920 × 1080) and **720p Compressed** (up to 1280 × 720, with stronger compression). Both retain aspect ratio and do not enlarge smaller sources. Caption download becomes available when caption text exists.

On **Your videos**, use the aligned format and sort dropdowns to organize the collection. Press **Ctrl+Shift+R** to refresh the local video list without leaving the library.

Click **Import video** at the top of Recording studio and choose an MP4, WebM, MOV, MKV, AVI, or M4V file (up to 1 GB). Root prepares a browser-playable H.264/AAC MP4 working copy in your selected save folder; your chosen original file stays unchanged. The working copy keeps the aspect ratio and is limited to 1920 × 1080. Processing may take several minutes for large files. After importing, use the same English caption, blur selection, preview, and MP4 export tools as for a recording. Videos without audio can be imported and blurred, but cannot generate speech captions.

### Webcam permissions

Turn on Webcam or click **Enable / retry camera**. A live preview confirms camera access even before selecting a screen. If no permission popup appears, use **Browser camera settings**, enable sites asking for camera access, and remove `http://localhost:4783` from the blocked list if present. Return to Root and retry. **Windows camera settings** opens Camera privacy settings; both Camera access and desktop app access must be enabled. These buttons open settings for you to review; Root does not change permissions automatically. If the webcam is already allowed, no new popup is expected. Close other camera apps if the device cannot start.

Use **Choose folder** in the recorder to select a save location with the Windows folder picker. Root checks that it can write to the folder and remembers it in `storage.json`. New original recordings and processed MP4s save to your selected location. Existing files remain in their original folders and can still be edited or downloaded; changing folders does not move them. Caption working files remain alongside their source recording. Browser download copies and manually downloaded SRT files still use your browser's download location.

Original recordings and processed files are saved under `recordings/`. They remain until you delete them manually. Downloaded exports also go to your browser's download location. There is no automatic cleanup. Recordings are buffered in browser memory, with a 1 GB upload ceiling; long recordings depend on available RAM. Closing the tab during recording can lose the unsaved recording. Captions process audio offline on CPU and may take time or need text corrections.

The server binds only to 127.0.0.1 and rejects requests from other web origins. The app does not request remote services during normal recording or editing. Setup downloads require internet. To stop the server press Ctrl+C in its terminal.

## Development

Blur editing supports rectangles and circles. Click **Add / edit blur**, select a shape, and drag empty video space to draw. Select an existing area to move it or resize it using its eight handles. Circles retain a circular shape in video pixels. Change the Shape selector to convert the selected area, use **Delete selected** to remove one, or **Clear areas** to remove all. Click **Done editing blur** to preview without outlines. All regions apply to the entire video and retain their shapes during MP4 export.

For animated blur, select an area and use **Video position** or **Time (seconds)** to seek. Moving or resizing the area at the new time automatically adds or updates a keyframe. **Add / update keyframe** also saves the current pose explicitly. Click a timestamp chip to return to a keyframe, or **Delete keyframe here** to remove it. Position and size interpolate linearly between keyframes in preview and MP4 export. Before the first and after the last keyframe, the endpoint pose holds. Shapes stay fixed per area, with up to 100 keyframes per area. This is manual animation; there is no automatic face or object tracking. Changes remain in the current editing session until exported.

While editing blur, click an area and press **Backspace** or **Delete** to remove that area and its keyframes. These keys retain normal behavior in text fields and controls. Hold neither key down to avoid accidental repeated removal.

No npm dependencies. Run `node server.mjs`. Validate syntax with `node --check server.mjs` and `node --check public/app.js`.

Requirement coverage: ROOT-REC-01–03 (browser picker/start/stop), ROOT-AUD-01–03 (Web Audio mixing and independent gain controls), ROOT-CAM-01–02 (canvas overlay), ROOT-CAP-01–02 (local whisper.cpp and editable SRT review), ROOT-BLR-01–02 (rectangle selection, preview, FFmpeg export), ROOT-EXP-01–02 (H.264/AAC MP4 download).
