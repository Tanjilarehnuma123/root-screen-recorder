using System;
using System.Drawing;
using System.IO;
using System.Threading;
using System.Windows.Forms;
using System.Web.Script.Serialization;
using System.Collections.Generic;
using System.Runtime.InteropServices;
class RecordingControls : Form {
 [DllImport("user32.dll")] static extern bool SetWindowDisplayAffinity(IntPtr window, uint affinity);
 readonly Label status = new Label();
 readonly Button pause = new Button(), stop = new Button();
 readonly StreamWriter output = new StreamWriter(Console.OpenStandardOutput());
 volatile string latest;
 DateTime updated = DateTime.UtcNow;
 protected override bool ShowWithoutActivation { get { return true; } }
 RecordingControls() {
  Text="Root · Recording controls — drag to move";TopMost=true;ShowInTaskbar=false;FormBorderStyle=FormBorderStyle.FixedToolWindow;ControlBox=false;
  BackColor=Color.FromArgb(12,21,35);ForeColor=Color.FromArgb(220,234,228);Font=new Font("Segoe UI",10);ClientSize=new Size(410,64);StartPosition=FormStartPosition.Manual;
  var area=Screen.FromPoint(Cursor.Position).WorkingArea;Location=new Point(area.Left+(area.Width-Width)/2,area.Bottom-Height-24);
  status.SetBounds(12,20,155,28);status.Text="Recording · 00:00";
  pause.Text="Pause";pause.SetBounds(174,10,102,44);stop.Text="■ Stop";stop.SetBounds(286,10,110,44);
  foreach(var button in new[]{pause,stop}){button.FlatStyle=FlatStyle.Flat;button.BackColor=Color.FromArgb(35,114,79);button.ForeColor=Color.White;Controls.Add(button);}
  Controls.Add(status);output.AutoFlush=true;pause.Click+=(s,e)=>Command("pause");stop.Click+=(s,e)=>Command("stop");
  Shown+=(s,e)=>SetWindowDisplayAffinity(Handle,0x11);
  var reader=new Thread(()=>{try{using(var input=new StreamReader(Console.OpenStandardInput())){string line;while((line=input.ReadLine())!=null)latest=line;}}catch{} latest="close";});reader.IsBackground=true;reader.Start();
  var timer=new System.Windows.Forms.Timer();timer.Interval=150;timer.Tick+=(s,e)=>{
   if(latest!=null){string line=latest;latest=null;if(line=="close"){Close();return;}try{
    var data=new JavaScriptSerializer().Deserialize<Dictionary<string,object>>(line);string state=(string)data["state"];double elapsed=Convert.ToDouble(data["elapsed"]);updated=DateTime.UtcNow;
    status.Text=(state=="paused"?"Paused":state=="saving"?"Saving":"Recording")+" · "+TimeSpan.FromMilliseconds(elapsed).ToString(@"mm\:ss");pause.Text=state=="paused"?"Resume":"Pause";pause.Enabled=stop.Enabled=state!="saving";
   }catch{}}
   if((DateTime.UtcNow-updated).TotalSeconds>10)Close();
  };timer.Start();FormClosed+=(s,e)=>timer.Dispose();
 }
 void Command(string action){pause.Enabled=stop.Enabled=false;try{output.WriteLine(action);}catch{Close();}}
 [STAThread] static void Main(){Application.EnableVisualStyles();Application.Run(new RecordingControls());}
}
