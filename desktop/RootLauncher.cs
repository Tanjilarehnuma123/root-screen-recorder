using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;
using System.Reflection;
[assembly: AssemblyTitle("Root Screen Recorder")]
[assembly: AssemblyProduct("Root Screen Recorder")]
[assembly: AssemblyVersion("1.0.0.0")]
class RootLauncher {
    static readonly string Folder = AppDomain.CurrentDomain.BaseDirectory;
    static bool Ready() {
        try {
            var request = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:4783/api/status");
            request.Timeout = 3000; request.Proxy = null;
            using (var response = request.GetResponse())
            using (var reader = new StreamReader(response.GetResponseStream())) {
                string data = reader.ReadToEnd();
                return data.Contains("\"ffmpeg\"") && data.Contains("\"captions\"");
            }
        } catch(Exception error) { try { File.WriteAllText(Path.Combine(Folder,"service-check.log"),error.ToString()); } catch {} return false; }
    }
    static string Browser() {
        string[] bases = { Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) };
        foreach (string dir in bases) {
            string edge = Path.Combine(dir, @"Microsoft\Edge\Application\msedge.exe");
            if (File.Exists(edge)) return edge;
            string chrome = Path.Combine(dir, @"Google\Chrome\Application\chrome.exe");
            if (File.Exists(chrome)) return chrome;
        }
        throw new Exception("Root requires Microsoft Edge or Google Chrome. Install either browser and open Root again.");
    }
    [STAThread] static int Main(string[] args) {
        try {
            string node = Path.Combine(Folder, @"runtime\node.exe");
            if (!File.Exists(node) || !File.Exists(Path.Combine(Folder, "server.mjs"))) throw new Exception("Root's files are missing. Keep Root.exe together with its runtime, public, and tools folders.");
            string browser = Browser();
            if (args.Length > 0 && args[0] == "--check") return 0;
            using (var mutex = new Mutex(false, "Local\\RootScreenRecorderLauncher")) {
                if (!mutex.WaitOne(15000)) throw new Exception("Root is already starting. Try opening it again in a moment.");
                try {
                    if (!Ready()) {
                        var start = new ProcessStartInfo(node, "\"" + Path.Combine(Folder,"server.mjs") + "\"");
                        start.WorkingDirectory = Folder;
                        start.UseShellExecute = false;
                        start.CreateNoWindow = true;
                        start.WindowStyle = ProcessWindowStyle.Hidden;
                        Process.Start(start);
                        bool ready = false;
                        for (int i=0; i<40; i++) { if (Ready()) { ready=true; break; } Thread.Sleep(250); }
                        if (!ready) throw new Exception("The local recording service could not start. Port 4783 may be occupied. Restart your PC and try again.");
                    }
                } finally { mutex.ReleaseMutex(); }
            }
            var app = new ProcessStartInfo(browser, "--app=http://localhost:4783 --window-size=1360,960");
            app.UseShellExecute = false;
            Process.Start(app);
            return 0;
        } catch(Exception error) { try { File.WriteAllText(Path.Combine(Folder,"launcher-error.log"),error.ToString()); } catch {} MessageBox.Show(error.Message,"Root Screen Recorder",MessageBoxButtons.OK,MessageBoxIcon.Error); return 1; }
    }
}
