<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>API Inspector — POST /api/v1/auth/login</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#020617;color:#e2e8f0;min-height:100vh;padding:32px}
.wrap{max-width:900px;margin:0 auto}
h1{font-size:22px;font-weight:700;color:#fff;margin-bottom:4px}
.sub{font-size:12px;color:#94a3b8;margin-bottom:24px}
.badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
.green{background:rgba(34,197,94,.15);color:#4ade80;border:1px solid rgba(34,197,94,.3)}
.blue{background:rgba(59,130,246,.15);color:#60a5fa;border:1px solid rgba(59,130,246,.3)}
.amber{background:rgba(245,158,11,.15);color:#fbbf24;border:1px solid rgba(245,158,11,.3)}
.card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:20px;margin-bottom:16px}
.card h3{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#64748b;margin-bottom:14px}
.row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.03)}
.row:last-child{border-bottom:none}
.row .l{font-size:12px;color:#94a3b8}
.row .v{font-size:12px;font-weight:600;color:#e2e8f0;text-align:right;max-width:55%;word-break:break-all}
pre{background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:14px;font-size:11px;color:#94a3b8;overflow-x:auto;line-height:1.6}
.code-key{color:#60a5fa}.code-str{color:#4ade80}.code-num{color:#fbbf24}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:700px){.grid2{grid-template-columns:1fr}}
.list{list-style:none}
.list li{font-size:12px;color:#cbd5e1;padding:4px 0;padding-left:14px;position:relative}
.list li::before{content:'›';position:absolute;left:0;color:#6366f1;font-weight:700}
.note{background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.2);border-radius:8px;padding:14px;font-size:12px;color:#c7d2fe;margin-top:16px}
</style>
</head>
<body>
<div class="wrap">
  <h1>Developer API Inspector</h1>
  <p class="sub">Endpoint reference — Smart PC Hub v1</p>

  <div class="card">
    <h3>Endpoint</h3>
    <div class="row"><span class="l">Path</span><span class="v" style="color:#4ade80;font-family:monospace">{{ $endpoint }}</span></div>
    <div class="row"><span class="l">Method</span><span class="v"><span class="badge green">{{ $method }}</span></span></div>
    <div class="row"><span class="l">Purpose</span><span class="v">{{ $purpose }}</span></div>
    <div class="row"><span class="l">CSRF</span><span class="v" style="color:#4ade80">{{ $csrf }}</span></div>
    <div class="row"><span class="l">Session Driver</span><span class="v">{{ $sessionDriver }}</span></div>
  </div>

  <div class="grid2">
    <div class="card">
      <h3>Expected Request Body</h3>
      <pre>{
  <span class="code-key">"email"</span>: <span class="code-str">"user@example.com"</span>,
  <span class="code-key">"password"</span>: <span class="code-str">"password"</span>
}</pre>
      <p style="font-size:11px;color:#64748b;margin-top:8px">Both fields are required.</p>
    </div>
    <div class="card">
      <h3>Success Response (200)</h3>
      <pre>{
  <span class="code-key">"success"</span>: <span class="code-num">true</span>,
  <span class="code-key">"message"</span>: <span class="code-str">"Login successful."</span>,
  <span class="code-key">"data"</span>: {
    <span class="code-key">"accessToken"</span>: <span class="code-str">"1|abc..."</span>,
    <span class="code-key">"tokenType"</span>: <span class="code-str">"Bearer"</span>,
    <span class="code-key">"user"</span>: { ... }
  }
}</pre>
    </div>
  </div>

  <div class="grid2">
    <div class="card">
      <h3>Backend Status</h3>
      <div class="row"><span class="l">Status</span><span class="v" style="color:#4ade80">{{ $backendStatus }}</span></div>
      <div class="row"><span class="l">Laravel</span><span class="v">{{ $laravelVersion }}</span></div>
      <div class="row"><span class="l">PHP</span><span class="v">{{ $phpVersion }}</span></div>
      <div class="row"><span class="l">Environment</span><span class="v"><span class="badge amber">{{ $environment }}</span></span></div>
      <div class="row"><span class="l">Debug</span><span class="v">{{ $debug }}</span></div>
      <div class="row"><span class="l">Timezone</span><span class="v">{{ $timezone }}</span></div>
      <div class="row"><span class="l">Server Time</span><span class="v" style="font-size:11px">{{ $serverTime }}</span></div>
    </div>
    <div class="card">
      <h3>System Configuration</h3>
      <div class="row"><span class="l">Database</span><span class="v"><span class="badge blue">{{ strtoupper($dbDriver) }}</span></span></div>
      <div class="row"><span class="l">DB Connected</span><span class="v" style="color:#4ade80">{{ $dbConnected ? 'Yes' : 'No' }}</span></div>
      <div class="row"><span class="l">Cache</span><span class="v">{{ $cacheStatus }}</span></div>
      <div class="row"><span class="l">Queue</span><span class="v">{{ $queueStatus }}</span></div>
      <div class="row"><span class="l">API Version</span><span class="v">{{ $apiVersion }}</span></div>
      <div class="row"><span class="l">Sanctum Guard</span><span class="v">{{ implode(', ', $sanctumGuard) }}</span></div>
    </div>
  </div>

  <div class="card">
    <h3>Available Authentication Endpoints</h3>
    @foreach($authEndpoints as $route => $desc)
    <div class="row"><span class="l" style="font-family:monospace;font-size:11px;color:#60a5fa">{{ $route }}</span><span class="v">{{ $desc }}</span></div>
    @endforeach
  </div>

  <div class="card">
    <h3>Notes for Examiner</h3>
    <ul class="list">
      @foreach($notes as $note)
      <li>{{ $note }}</li>
      @endforeach
    </ul>
  </div>

  <div class="note">
    <strong>Remember:</strong> Use POST method to authenticate. This GET page is for documentation only.
    Send requests with <code style="color:#60a5fa">Content-Type: application/json</code> header.
  </div>
</div>
</body>
</html>
