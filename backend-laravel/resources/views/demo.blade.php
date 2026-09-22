<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Smart PC Hub — Developer Console</title>
<style>
:root{--bg:#020617;--sidebar:#0f172a;--card:#0f172a;--border:rgba(255,255,255,.06);--text:#e2e8f0;--muted:#94a3b8;--dim:#64748b;--accent:#6366f1;--green:#4ade80;--red:#f87171;--blue:#60a5fa;--amber:#fbbf24;--purple:#a78bfa}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);display:flex;min-height:100vh;overflow:hidden}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:3px}

/* Sidebar */
.sidebar{width:240px;background:var(--sidebar);border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;overflow-y:auto}
.sidebar .logo{padding:20px;border-bottom:1px solid var(--border)}
.sidebar .logo h1{font-size:14px;font-weight:700;color:#fff}
.sidebar .logo p{font-size:10px;color:var(--dim);margin-top:2px}
.nav{padding:8px 0}
.nav-group{padding:4px 16px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--dim);margin-top:8px}
.nav-item{display:flex;align-items:center;gap:10px;padding:9px 16px;font-size:12px;color:var(--muted);cursor:pointer;transition:.15s;border-left:2px solid transparent}
.nav-item:hover{background:rgba(255,255,255,.03);color:var(--text)}
.nav-item.active{color:var(--accent);border-left-color:var(--accent);background:rgba(99,102,241,.05)}
.nav-item .icon{width:16px;text-align:center;font-size:12px}

/* Main */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.topbar{height:48px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:rgba(255,255,255,.01);flex-shrink:0}
.topbar h2{font-size:13px;font-weight:600}
.topbar .badges{display:flex;gap:8px}
.badge{padding:3px 10px;border-radius:10px;font-size:10px;font-weight:700}
.b-green{background:rgba(34,197,94,.12);color:var(--green);border:1px solid rgba(34,197,94,.2)}
.b-blue{background:rgba(59,130,246,.12);color:var(--blue);border:1px solid rgba(59,130,246,.2)}
.b-amber{background:rgba(245,158,11,.12);color:var(--amber);border:1px solid rgba(245,158,11,.2)}
.content{flex:1;overflow-y:auto;padding:24px}

/* Panels */
.panel{display:none}.panel.active{display:block}

/* Cards */
.grid{display:grid;gap:14px}
.g2{grid-template-columns:repeat(2,1fr)}.g3{grid-template-columns:repeat(3,1fr)}.g4{grid-template-columns:repeat(4,1fr)}.g5{grid-template-columns:repeat(5,1fr)}
@media(max-width:1200px){.g4,.g5{grid-template-columns:repeat(3,1fr)}}
@media(max-width:900px){.g3,.g4,.g5{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.g2,.g3,.g4,.g5{grid-template-columns:1fr}}
.card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px}
.card h3{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:var(--dim);margin-bottom:12px}
.stat{font-size:28px;font-weight:700;color:#fff;line-height:1}
.stat-label{font-size:11px;color:var(--muted);margin-top:4px}
.stat-green{color:var(--green)}.stat-blue{color:var(--blue)}.stat-amber{color:var(--amber)}.stat-purple{color:var(--purple)}.stat-red{color:var(--red)}

/* Table */
.tbl{width:100%;border-collapse:collapse;font-size:12px}
.tbl th{text-align:left;padding:8px 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--dim);border-bottom:1px solid var(--border)}
.tbl td{padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.02);color:var(--muted)}
.tbl tr:hover td{background:rgba(255,255,255,.02)}
.m-get{color:var(--green);font-weight:700}.m-post{color:var(--blue);font-weight:700}.m-put{color:var(--amber);font-weight:700}.m-delete{color:var(--red);font-weight:700}

/* Code */
pre{background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;padding:14px;font-size:11px;color:var(--muted);overflow-x:auto;font-family:'Fira Code',monospace;line-height:1.6}
.code-k{color:var(--blue)}.code-s{color:var(--green)}.code-n{color:var(--amber)}.code-c{color:var(--dim)}

/* Buttons */
.btn{padding:6px 14px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid var(--border);transition:.15s;display:inline-flex;align-items:center;gap:6px}
.btn-primary{background:var(--accent);color:#fff;border-color:var(--accent)}.btn-primary:hover{opacity:.85}
.btn-ghost{background:transparent;color:var(--muted)}.btn-ghost:hover{background:rgba(255,255,255,.05)}
.btn-sm{padding:4px 10px;font-size:10px}

/* Tabs */
.tabs{display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:16px}
.tab{padding:8px 16px;font-size:11px;font-weight:600;color:var(--dim);cursor:pointer;border-bottom:2px solid transparent;transition:.15s}
.tab:hover{color:var(--muted)}.tab.active{color:var(--accent);border-bottom-color:var(--accent)}

/* Search */
.search{background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:6px;padding:7px 12px;color:var(--text);font-size:12px;width:220px;outline:none}
.search:focus{border-color:var(--accent)}

/* Flow */
.flow{display:flex;flex-direction:column;gap:6px}
.flow-step{display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(99,102,241,.06);border-radius:6px;border-left:3px solid var(--accent)}
.flow-step .num{width:22px;height:22px;border-radius:50%;background:rgba(99,102,241,.15);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0}
.flow-step .name{font-size:11px;font-weight:600;color:var(--text);min-width:120px}
.flow-step .desc{font-size:10px;color:var(--muted)}

/* Health */
.health-item{display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px}
.health-dot{width:8px;height:8px;border-radius:50%}
.dot-green{background:var(--green)}.dot-red{background:var(--red)}

/* Modal */
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:999;align-items:center;justify-content:center}
.modal-overlay.open{display:flex}
.modal{background:var(--sidebar);border:1px solid var(--border);border-radius:12px;width:90%;max-width:700px;max-height:80vh;overflow-y:auto;padding:24px}
.modal h3{font-size:14px;font-weight:700;color:#fff;margin-bottom:16px}
.modal-close{position:absolute;top:16px;right:16px;color:var(--muted);cursor:pointer;font-size:18px}
</style>
</head>
<body>
@php
  $apiRoutes = collect($routes ?? [])->filter(fn($r) => str_starts_with($r['uri'] ?? '', 'api/'));
@endphp

<!-- Sidebar -->
<div class="sidebar">
  <div class="logo">
    <h1>Developer Console</h1>
    <p>Smart PC Hub — Inspector</p>
  </div>
  <div class="nav">
    <div class="nav-group">Overview</div>
    <div class="nav-item active" onclick="showPanel('dashboard')"><span class="icon">🏠</span>Dashboard</div>

    <div class="nav-group">API</div>
    <div class="nav-item" onclick="showPanel('api-explorer')"><span class="icon">⚡</span>API Explorer</div>
    <div class="nav-item" onclick="showPanel('routes')"><span class="icon">🛤</span>Routes</div>
    <div class="nav-item" onclick="showPanel('auth')"><span class="icon">🔐</span>Authentication</div>
    <div class="nav-item" onclick="showPanel('payloads')"><span class="icon">📋</span>Example Payloads</div>

    <div class="nav-group">Database</div>
    <div class="nav-item" onclick="showPanel('db-tables')"><span class="icon">🗄</span>Tables</div>
    <div class="nav-item" onclick="showPanel('db-erd')"><span class="icon">🔗</span>ER Diagram</div>

    <div class="nav-group">Server</div>
    <div class="nav-item" onclick="showPanel('server')"><span class="icon">📡</span>Server Info</div>
    <div class="nav-item" onclick="showPanel('health')"><span class="icon">💚</span>API Health</div>
    <div class="nav-item" onclick="showPanel('performance')"><span class="icon">📊</span>Performance</div>

    <div class="nav-group">Monitor</div>
    <div class="nav-item" onclick="showPanel('live-monitor')"><span class="icon">📈</span>Live Monitor</div>
    <div class="nav-item" onclick="showPanel('tokens')"><span class="icon">🎫</span>Tokens</div>
    <div class="nav-item" onclick="showPanel('logs')"><span class="icon">📝</span>Logs</div>

    <div class="nav-group">Tools</div>
    <div class="nav-item" onclick="showPanel('quick-login')"><span class="icon">🚀</span>Quick Login</div>
    <div class="nav-item" onclick="showPanel('architecture')"><span class="icon">🏗</span>Architecture</div>
    <div class="nav-item" onclick="showPanel('examiner')"><span class="icon">🎓</span>Examiner Mode</div>
  </div>
</div>

<!-- Main Content -->
<div class="main">
  <div class="topbar">
    <h2 id="panel-title">Dashboard</h2>
    <div class="badges">
      <span class="badge b-green">Laravel {{ $laravelVersion }}</span>
      <span class="badge b-blue">PHP {{ $phpVersion }}</span>
      <span class="badge b-amber">{{ strtoupper($dbDriver) }}</span>
    </div>
  </div>

  <div class="content">

    <!-- DASHBOARD -->
    <div id="dashboard" class="panel active">
      <div class="grid g5" style="margin-bottom:16px">
        <div class="card"><div class="stat stat-green">●</div><div class="stat-label">Backend Running</div></div>
        <div class="card"><div class="stat">{{ $userCount ?? 0 }}</div><div class="stat-label">Users</div></div>
        <div class="card"><div class="stat stat-blue">{{ $repairCount ?? 0 }}</div><div class="stat-label">Repair Requests</div></div>
        <div class="card"><div class="stat stat-purple">{{ $buildCount ?? 0 }}</div><div class="stat-label">PC Builds</div></div>
        <div class="card"><div class="stat stat-amber">{{ $gigCount ?? 0 }}</div><div class="stat-label">Gigs</div></div>
      </div>
      <div class="grid g4">
        <div class="card"><h3>System</h3>
          <div style="font-size:12px;color:var(--muted)">
            <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Laravel</span><span style="color:var(--text)">{{ $laravelVersion }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:4px 0"><span>PHP</span><span style="color:var(--text)">{{ $phpVersion }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Environment</span><span class="badge b-amber" style="font-size:9px">{{ $environment }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Database</span><span style="color:var(--text)">{{ strtoupper($dbDriver) }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Timezone</span><span style="color:var(--text)">{{ $timezone }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Cache</span><span style="color:var(--text)">{{ $cacheDriver }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Queue</span><span style="color:var(--text)">{{ $queueDriver }}</span></div>
          </div>
        </div>
        <div class="card"><h3>Users by Role</h3>
          <div style="font-size:12px;color:var(--muted)">
            <div style="display:flex;justify-content:space-between;padding:6px 0"><span>Admins</span><span style="color:var(--red);font-weight:700">{{ $adminCount ?? 0 }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:6px 0"><span>Technicians</span><span style="color:var(--blue);font-weight:700">{{ $techCount ?? 0 }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:6px 0"><span>Customers</span><span style="color:var(--green);font-weight:700">{{ $customerCount ?? 0 }}</span></div>
          </div>
        </div>
        <div class="card"><h3>Repairs</h3>
          <div style="font-size:12px;color:var(--muted)">
            <div style="display:flex;justify-content:space-between;padding:6px 0"><span>Total</span><span style="color:var(--text);font-weight:700">{{ $repairCount ?? 0 }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:6px 0"><span>Active</span><span style="color:var(--amber);font-weight:700">{{ $activeRepairs ?? 0 }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:6px 0"><span>Completed</span><span style="color:var(--green);font-weight:700">{{ $completedRepairs ?? 0 }}</span></div>
          </div>
        </div>
        <div class="card"><h3>Auth</h3>
          <div style="font-size:12px;color:var(--muted)">
            <div style="display:flex;justify-content:space-between;padding:6px 0"><span>Driver</span><span style="color:var(--text)">Sanctum Token</span></div>
            <div style="display:flex;justify-content:space-between;padding:6px 0"><span>Active Tokens</span><span style="color:var(--text);font-weight:700">{{ $tokenCount ?? 0 }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:6px 0"><span>Session</span><span style="color:var(--text)">{{ $sessionDriver }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:6px 0"><span>CSRF</span><span style="color:var(--green)">Disabled (token auth)</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- API EXPLORER -->
    <div id="api-explorer" class="panel">
      <div style="margin-bottom:16px;display:flex;gap:8px;align-items:center">
        <input class="search" placeholder="Search endpoints..." oninput="filterApi(this.value)">
        <div class="tabs" id="api-tabs">
          <div class="tab active" onclick="filterMethod('all',this)">All</div>
          <div class="tab" onclick="filterMethod('GET',this)">GET</div>
          <div class="tab" onclick="filterMethod('POST',this)">POST</div>
          <div class="tab" onclick="filterMethod('PUT',this)">PUT</div>
          <div class="tab" onclick="filterMethod('DELETE',this)">DELETE</div>
        </div>
      </div>
      <div class="card" style="padding:0;overflow:hidden">
        <table class="tbl" id="api-table">
          <thead><tr><th>Method</th><th>URI</th><th>Controller</th><th>Middleware</th><th>Name</th><th></th></tr></thead>
          <tbody>
          @foreach($apiRoutes as $route)
          <tr class="api-row" data-method="{{ $route['method'] ?? '' }}" data-uri="{{ $route['uri'] ?? '' }}">
            <td><span class="m-{{ strtolower(explode('|', $route['method'] ?? '')[0]) }}">{{ $route['method'] ?? '' }}</span></td>
            <td style="font-family:monospace;font-size:11px;color:var(--text)">{{ $route['uri'] ?? '' }}</td>
            <td style="font-size:11px">{{ $route['action'] ?? '' }}</td>
            <td style="font-size:10px">{{ is_array($route['middleware'] ?? null) ? implode(', ', $route['middleware']) : ($route['middleware'] ?? '—') }}</td>
            <td style="font-size:10px;color:var(--accent)">{{ $route['name'] ?? '' }}</td>
            <td><button class="btn btn-sm btn-ghost" onclick='showApiDetail(@json($route))'>Details</button></td>
          </tr>
          @endforeach
          </tbody>
        </table>
      </div>
    </div>

    <!-- ROUTES -->
    <div id="routes" class="panel">
      <div style="margin-bottom:16px;display:flex;gap:8px">
        <input class="search" placeholder="Search routes..." oninput="filterRoutes(this.value)">
      </div>
      <div class="card" style="padding:0;overflow:hidden">
        <table class="tbl" id="routes-table">
          <thead><tr><th>Method</th><th>URI</th><th>Name</th><th>Action</th></tr></thead>
          <tbody>
          @foreach($routes ?? [] as $route)
          <tr class="route-row" data-search="{{ ($route['method']??'').' '.($route['uri']??'').'. '.($route['name']??'') }}">
            <td><span class="m-{{ strtolower(explode('|', $route['method'] ?? '')[0]) }}">{{ $route['method'] ?? '' }}</span></td>
            <td style="font-family:monospace;font-size:11px">{{ $route['uri'] ?? '' }}</td>
            <td style="font-size:10px;color:var(--accent)">{{ $route['name'] ?? '—' }}</td>
            <td style="font-size:11px">{{ $route['action'] ?? '' }}</td>
          </tr>
          @endforeach
          </tbody>
        </table>
      </div>
    </div>

    <!-- AUTH -->
    <div id="auth" class="panel">
      <div class="grid g2">
        <div class="card">
          <h3>Authentication Flow</h3>
          <div class="flow">
            <div class="flow-step"><span class="num">1</span><span class="name">User submits</span><span class="desc">Email + Password</span></div>
            <div class="flow-step"><span class="num">2</span><span class="name">POST /auth/login</span><span class="desc">AuthController@login</span></div>
            <div class="flow-step"><span class="num">3</span><span class="name">AuthService</span><span class="desc">Hash::check validation</span></div>
            <div class="flow-step"><span class="num">4</span><span class="name">Sanctum Token</span><span class="desc">Bearer token generated</span></div>
            <div class="flow-step"><span class="num">5</span><span class="name">JSON Response</span><span class="desc">Token + User data</span></div>
            <div class="flow-step"><span class="num">6</span><span class="name">Frontend stores</span><span class="desc">localStorage + AuthProvider</span></div>
          </div>
        </div>
        <div class="card">
          <h3>Role-Based Access Control</h3>
          <div style="font-size:12px;color:var(--muted);line-height:1.8">
            <div><span class="badge b-green" style="font-size:9px">ADMIN</span> Full access — all resources, user management, assignments</div>
            <div><span class="badge b-blue" style="font-size:9px">TECHNICIAN</span> Assigned jobs, service history, gig management</div>
            <div><span class="badge b-amber" style="font-size:9px">CUSTOMER</span> Own requests, browse gigs, PC builds</div>
          </div>
          <h3 style="margin-top:16px">Middleware</h3>
          <div style="font-size:11px;color:var(--muted);font-family:monospace">
            auth:sanctum → role:admin → Controller
          </div>
        </div>
      </div>
    </div>

    <!-- PAYLOADS -->
    <div id="payloads" class="panel">
      <div class="grid g2">
        <div class="card"><h3>Login</h3><pre>{
  <span class="code-k">"email"</span>: <span class="code-s">"admin@smartpchub.test"</span>,
  <span class="code-k">"password"</span>: <span class="code-s">"password"</span>
}</pre><button class="btn btn-sm btn-primary" style="margin-top:8px" onclick="copyText('{&quot;email&quot;:&quot;admin@smartpchub.test&quot;,&quot;password&quot;:&quot;password&quot;}')">Copy</button></div>
        <div class="card"><h3>Register</h3><pre>{
  <span class="code-k">"name"</span>: <span class="code-s">"John Doe"</span>,
  <span class="code-k">"email"</span>: <span class="code-s">"john@test.com"</span>,
  <span class="code-k">"password"</span>: <span class="code-s">"password"</span>,
  <span class="code-k">"password_confirmation"</span>: <span class="code-s">"password"</span>,
  <span class="code-k">"role"</span>: <span class="code-s">"user"</span>
}</pre><button class="btn btn-sm btn-primary" style="margin-top:8px" onclick="copyText('{&quot;name&quot;:&quot;John Doe&quot;,&quot;email&quot;:&quot;john@test.com&quot;,&quot;password&quot;:&quot;password&quot;,&quot;password_confirmation&quot;:&quot;password&quot;,&quot;role&quot;:&quot;user&quot;}')">Copy</button></div>
        <div class="card"><h3>Create Repair Request</h3><pre>{
  <span class="code-k">"title"</span>: <span class="code-s">"Laptop screen flickering"</span>,
  <span class="code-k">"description"</span>: <span class="code-s">"Screen flickers every 5 seconds"</span>,
  <span class="code-k">"deviceType"</span>: <span class="code-s">"Laptop"</span>,
  <span class="code-k">"deviceBrand"</span>: <span class="code-s">"Dell"</span>,
  <span class="code-k">"issueCategory"</span>: <span class="code-s">"Hardware"</span>,
  <span class="code-k">"severityLevel"</span>: <span class="code-s">"Medium"</span>
}</pre><button class="btn btn-sm btn-primary" style="margin-top:8px" onclick="copyText('{&quot;title&quot;:&quot;Laptop screen flickering&quot;,&quot;description&quot;:&quot;Screen flickers&quot;,&quot;deviceType&quot;:&quot;Laptop&quot;,&quot;deviceBrand&quot;:&quot;Dell&quot;,&quot;issueCategory&quot;:&quot;Hardware&quot;,&quot;severityLevel&quot;:&quot;Medium&quot;}')">Copy</button></div>
        <div class="card"><h3>Create Gig</h3><pre>{
  <span class="code-k">"title"</span>: <span class="code-s">"GPU Repair Specialist"</span>,
  <span class="code-k">"description"</span>: <span class="code-s">"Expert in graphics card issues"</span>,
  <span class="code-k">"category"</span>: <span class="code-s">"HARDWARE_ISSUE"</span>,
  <span class="code-k">"estimatedTime"</span>: <span class="code-s">"2-3 hours"</span>
}</pre><button class="btn btn-sm btn-primary" style="margin-top:8px" onclick="copyText('{&quot;title&quot;:&quot;GPU Repair&quot;,&quot;description&quot;:&quot;Expert in GPU&quot;,&quot;category&quot;:&quot;HARDWARE_ISSUE&quot;,&quot;estimatedTime&quot;:&quot;2-3 hours&quot;}')">Copy</button></div>
      </div>
    </div>

    <!-- DB TABLES -->
    <div id="db-tables" class="panel">
      <div class="grid g3" style="margin-bottom:16px">
        @foreach($tables as $table)
        <div class="card" style="cursor:pointer" onclick="showTable('{{ $table }}')">
          <h3>{{ $table }}</h3>
          <div style="font-size:11px;color:var(--muted)">Click to explore</div>
        </div>
        @endforeach
      </div>
    </div>

    <!-- ER DIAGRAM -->
    <div id="db-erd" class="panel">
      <div class="card">
        <h3>Entity Relationship Diagram</h3>
        <div class="flow" style="max-width:500px">
          <div class="flow-step"><span class="num">1</span><span class="name">users</span><span class="desc">id, name, email, role, status</span></div>
          <div class="flow-step" style="margin-left:20px"><span class="num">↓</span><span class="name">repair_requests</span><span class="desc">user_id → users.id</span></div>
          <div class="flow-step" style="margin-left:40px"><span class="num">↓</span><span class="name">lifecycle_events</span><span class="desc">repair_request_id → repair_requests.id</span></div>
          <div class="flow-step" style="margin-left:40px"><span class="num">↓</span><span class="name">completion_reports</span><span class="desc">repair_request_id → repair_requests.id</span></div>
          <div class="flow-step" style="margin-left:20px"><span class="num">↓</span><span class="name">gigs</span><span class="desc">technician_id → users.id</span></div>
          <div class="flow-step" style="margin-left:20px"><span class="num">↓</span><span class="name">pc_builds</span><span class="desc">user_id → users.id</span></div>
          <div class="flow-step" style="margin-left:20px"><span class="num">↓</span><span class="name">user_history</span><span class="desc">user_id → users.id</span></div>
          <div class="flow-step" style="margin-left:20px"><span class="num">↓</span><span class="name">technician_profiles</span><span class="desc">user_id → users.id</span></div>
          <div class="flow-step"><span class="num">↓</span><span class="name">personal_access_tokens</span><span class="desc">tokenable → users.id (Sanctum)</span></div>
        </div>
      </div>
    </div>

    <!-- SERVER -->
    <div id="server" class="panel">
      <div class="grid g3">
        <div class="card"><h3>PHP</h3><div class="stat">{{ $phpVersion }}</div><div class="stat-label">Version</div></div>
        <div class="card"><h3>Laravel</h3><div class="stat stat-blue">{{ $laravelVersion }}</div><div class="stat-label">Framework</div></div>
        <div class="card"><h3>Database</h3><div class="stat stat-purple">{{ strtoupper($dbDriver) }}</div><div class="stat-label">Driver</div></div>
        <div class="card"><h3>Environment</h3><div class="stat stat-amber">{{ $environment }}</div><div class="stat-label">APP_ENV</div></div>
        <div class="card"><h3>Timezone</h3><div class="stat" style="font-size:18px">{{ $timezone }}</div><div class="stat-label">App Timezone</div></div>
        <div class="card"><h3>Server Time</h3><div class="stat" style="font-size:14px">{{ $serverTime }}</div><div class="stat-label">Current Time</div></div>
      </div>
    </div>

    <!-- HEALTH -->
    <div id="health" class="panel">
      <div class="grid g2">
        <div class="card">
          <h3>API Health</h3>
          <div class="health-item"><span class="health-dot dot-green"></span>Authentication<span style="margin-left:auto;color:var(--green)">✔</span></div>
          <div class="health-item"><span class="health-dot dot-green"></span>Repair API<span style="margin-left:auto;color:var(--green)">✔</span></div>
          <div class="health-item"><span class="health-dot dot-green"></span>Gig API<span style="margin-left:auto;color:var(--green)">✔</span></div>
          <div class="health-item"><span class="health-dot dot-green"></span>PC Build API<span style="margin-left:auto;color:var(--green)">✔</span></div>
          <div class="health-item"><span class="health-dot dot-green"></span>Admin API<span style="margin-left:auto;color:var(--green)">✔</span></div>
          <div class="health-item"><span class="health-dot dot-green"></span>Database<span style="margin-left:auto;color:var(--green)">✔</span></div>
          <div class="health-item"><span class="health-dot dot-green"></span>Sanctum<span style="margin-left:auto;color:var(--green)">✔</span></div>
          <div class="health-item"><span class="health-dot dot-green"></span>Storage<span style="margin-left:auto;color:var(--green)">✔</span></div>
          <div class="health-item"><span class="health-dot {{ $queueDriver === 'sync' ? 'dot-green' : 'dot-red' }}"></span>Queue<span style="margin-left:auto;color:{{ $queueDriver === 'sync' ? 'var(--green)' : 'var(--red)' }}">{{ $queueDriver === 'sync' ? '✔ Sync' : '⚠' }}</span></div>
          <div class="health-item"><span class="health-dot dot-green"></span>Cache<span style="margin-left:auto;color:var(--green)">✔ {{ $cacheDriver }}</span></div>
        </div>
        <div class="card">
          <h3>Performance</h3>
          <div style="font-size:12px;color:var(--muted)">
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span>DB Queries</span><span style="color:var(--text)">Lazy loaded</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span>Memory</span><span style="color:var(--text)">PHP managed</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span>Cache Driver</span><span style="color:var(--text)">{{ $cacheDriver }}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0"><span>Session Driver</span><span style="color:var(--text)">{{ $sessionDriver }}</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- PERFORMANCE -->
    <div id="performance" class="panel">
      <div class="grid g4">
        <div class="card"><div class="stat stat-green">{{ $tokenCount ?? 0 }}</div><div class="stat-label">Active Tokens</div></div>
        <div class="card"><div class="stat stat-blue">{{ count($tables ?? []) }}</div><div class="stat-label">DB Tables</div></div>
        <div class="card"><div class="stat stat-purple">{{ count($routes ?? []) }}</div><div class="stat-label">Registered Routes</div></div>
        <div class="card"><div class="stat stat-amber">{{ count($apiRoutes ?? []) }}</div><div class="stat-label">API Endpoints</div></div>
      </div>
    </div>

    <!-- LIVE MONITOR -->
    <div id="live-monitor" class="panel">
      <div class="card">
        <h3>Live Request Monitor</h3>
        <p style="font-size:11px;color:var(--dim);margin-bottom:12px">Auto-refreshes every 10 seconds. Shows recent API activity.</p>
        <div id="monitor-list" style="font-size:12px;color:var(--muted)">Loading...</div>
      </div>
    </div>

    <!-- TOKENS -->
    <div id="tokens" class="panel">
      <div class="card">
        <h3>Active Sanctum Tokens</h3>
        <p style="font-size:11px;color:var(--dim)">Token-based authentication via Laravel Sanctum. No sessions used.</p>
        <div style="margin-top:12px;font-size:12px;color:var(--muted)">
          <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>Auth Driver</span><span style="color:var(--text)">Sanctum Bearer Token</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>Token Storage</span><span style="color:var(--text)">localStorage (frontend)</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>Token Format</span><span style="color:var(--text)">1|uuid... (hashed)</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 0"><span>Total Issued</span><span style="color:var(--text);font-weight:700">{{ $tokenCount ?? 0 }}</span></div>
        </div>
      </div>
    </div>

    <!-- LOGS -->
    <div id="logs" class="panel">
      <div class="card">
        <h3>Application Logs</h3>
        <p style="font-size:11px;color:var(--dim)">Log channel: {{ config('logging.default', 'stack') }}</p>
        <pre id="log-content" style="margin-top:12px;max-height:400px;overflow-y:auto">Loading logs...</pre>
      </div>
    </div>

    <!-- QUICK LOGIN -->
    <div id="quick-login" class="panel">
      <div class="card">
        <h3>Role Simulator — Quick Login</h3>
        <p style="font-size:11px;color:var(--dim);margin-bottom:16px">One-click login using seeded demo accounts. Opens the React app.</p>
        <div class="grid g3">
          <div style="background:rgba(239,68,68,.05);border:1px solid rgba(239,68,68,.15);border-radius:10px;padding:20px;text-align:center">
            <div style="font-size:28px;margin-bottom:8px">🔴</div>
            <div style="font-size:13px;font-weight:700;color:var(--red);margin-bottom:4px">Admin</div>
            <div style="font-size:10px;color:var(--dim);margin-bottom:12px">admin@smartpchub.test</div>
            <button class="btn btn-primary" onclick="quickLogin('admin@smartpchub.test','password')">Login as Admin</button>
          </div>
          <div style="background:rgba(59,130,246,.05);border:1px solid rgba(59,130,246,.15);border-radius:10px;padding:20px;text-align:center">
            <div style="font-size:28px;margin-bottom:8px">🔵</div>
            <div style="font-size:13px;font-weight:700;color:var(--blue);margin-bottom:4px">Technician</div>
            <div style="font-size:10px;color:var(--dim);margin-bottom:12px">ali.hassan@smartpchub.test</div>
            <button class="btn btn-primary" onclick="quickLogin('ali.hassan@smartpchub.test','password')">Login as Technician</button>
          </div>
          <div style="background:rgba(34,197,94,.05);border:1px solid rgba(34,197,94,.15);border-radius:10px;padding:20px;text-align:center">
            <div style="font-size:28px;margin-bottom:8px">🟢</div>
            <div style="font-size:13px;font-weight:700;color:var(--green);margin-bottom:4px">Customer</div>
            <div style="font-size:10px;color:var(--dim);margin-bottom:12px">customer1@smartpchub.test</div>
            <button class="btn btn-primary" onclick="quickLogin('customer1@smartpchub.test','password')">Login as Customer</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ARCHITECTURE -->
    <div id="architecture" class="panel">
      <div class="card">
        <h3>Request Flow</h3>
        <div class="flow" style="max-width:500px">
          <div class="flow-step"><span class="num">1</span><span class="name">React Frontend</span><span class="desc">Component + useState</span></div>
          <div class="flow-step"><span class="num">2</span><span class="name">API Client (Axios)</span><span class="desc">POST /api/v1/auth/login</span></div>
          <div class="flow-step"><span class="num">3</span><span class="name">Laravel Router</span><span class="desc">routes/api.php</span></div>
          <div class="flow-step"><span class="num">4</span><span class="name">Middleware</span><span class="desc">auth:sanctum + role check</span></div>
          <div class="flow-step"><span class="num">5</span><span class="name">Controller</span><span class="desc">AuthController@login</span></div>
          <div class="flow-step"><span class="num">6</span><span class="name">Service Layer</span><span class="desc">AuthService::login()</span></div>
          <div class="flow-step"><span class="num">7</span><span class="name">Eloquent Model</span><span class="desc">User::where()->first()</span></div>
          <div class="flow-step"><span class="num">8</span><span class="name">SQLite Database</span><span class="desc">Query execution</span></div>
          <div class="flow-step"><span class="num">9</span><span class="name">JSON Response</span><span class="desc">200 OK + Bearer Token</span></div>
          <div class="flow-step"><span class="num">10</span><span class="name">React State</span><span class="desc">AuthProvider updates</span></div>
        </div>
      </div>
    </div>

    <!-- EXAMINER -->
    <div id="examiner" class="panel">
      <div class="grid g2">
        <div class="card"><h3>Technology Stack</h3><ul style="font-size:12px;color:var(--muted);list-style:none;line-height:2"><li>▸ Frontend: React 19 + TypeScript + Vite</li><li>▸ Backend: Laravel 11 + PHP 8.3</li><li>▸ Database: SQLite (swappable)</li><li>▸ Auth: Laravel Sanctum (Bearer tokens)</li><li>▸ Styling: Tailwind CSS v4</li><li>▸ Build: Vite + Code Splitting</li></ul></div>
        <div class="card"><h3>Why Laravel?</h3><ul style="font-size:12px;color:var(--muted);list-style:none;line-height:2"><li>▸ Mature ecosystem with built-in auth</li><li>▸ Eloquent ORM for database abstraction</li><li>▸ Service layer pattern</li><li>▸ Policy-based RBAC</li><li>▸ Sanctum for SPA token auth</li><li>▸ Migration-based schema management</li></ul></div>
        <div class="card"><h3>Authentication</h3><ul style="font-size:12px;color:var(--muted);list-style:none;line-height:2"><li>▸ Token-based (no sessions)</li><li>▸ Bearer token in Authorization header</li><li>▸ bcrypt password hashing</li><li>▸ UUID primary keys</li><li>▸ Stateless design</li><li>▸ No CSRF needed</li></ul></div>
        <div class="card"><h3>RBAC</h3><ul style="font-size:12px;color:var(--muted);list-style:none;line-height:2"><li>▸ 3 roles: Admin, Technician, Customer</li><li>▸ RoleMiddleware enforces access</li><li>▸ Policies per resource</li><li>▸ Admin: full access</li><li>▸ Technician: assigned jobs</li><li>▸ Customer: own requests</li></ul></div>
        <div class="card"><h3>AI Integration</h3><ul style="font-size:12px;color:var(--muted);list-style:none;line-height:2"><li>▸ Modular driver architecture</li><li>▸ Gemini API / Local fallback</li><li>▸ Repair triage + severity scoring</li><li>▸ Configurable via .env</li><li>▸ AI_ENABLED toggle</li><li>▸ Automatic categorization</li></ul></div>
        <div class="card"><h3>Scalability</h3><ul style="font-size:12px;color:var(--muted);list-style:none;line-height:2"><li>▸ Service layer separation</li><li>▸ API-first (mobile-ready)</li><li>▸ Stateless horizontal scaling</li><li>▸ Token auth (no server sessions)</li><li>▸ Modular frontend (code splitting)</li><li>▸ SQLite ↔ MySQL swappable</li></ul></div>
      </div>
    </div>

  </div>
</div>

<!-- API Detail Modal -->
<div class="modal-overlay" id="api-modal" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <h3 id="modal-title">Endpoint Details</h3>
    <div id="modal-body"></div>
    <div style="margin-top:16px;text-align:right">
      <button class="btn btn-ghost" onclick="closeModal()">Close</button>
    </div>
  </div>
</div>

<script>
const API='{{ url("/api") }}';
const TOKEN='{{ $token }}';

function showPanel(id){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  event?.target?.closest?.('.nav-item')?.classList.add('active');
  document.getElementById('panel-title').textContent=id.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
}

function filterApi(q){
  const rows=document.querySelectorAll('.api-row');
  rows.forEach(r=>{r.style.display=r.dataset.uri.toLowerCase().includes(q.toLowerCase())?'':'none'});
}
function filterMethod(m,el){
  document.querySelectorAll('#api-tabs .tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.api-row').forEach(r=>{
    if(m==='all')r.style.display='';
    else r.style.display=r.dataset.method.includes(m)?'':'none';
  });
}
function filterRoutes(q){
  document.querySelectorAll('.route-row').forEach(r=>{
    r.style.display=r.dataset.search.toLowerCase().includes(q.toLowerCase())?'':'none';
  });
}

function showApiDetail(route){
  document.getElementById('modal-title').textContent=(route.method||'')+' '+(route.uri||'');
  document.getElementById('modal-body').innerHTML=`
    <div style="font-size:12px;color:var(--muted)">
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>Controller</span><span style="color:var(--text)">${route.action||'—'}</span></div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>Middleware</span><span style="color:var(--text)">${Array.isArray(route.middleware)?route.middleware.join(', '):(route.middleware||'—')}</span></div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>Name</span><span style="color:var(--accent)">${route.name||'—'}</span></div>
      <div style="display:flex;justify-content:space-between;padding:6px 0"><span>Method</span><span style="color:var(--text)">${route.method||'—'}</span></div>
    </div>`;
  document.getElementById('api-modal').classList.add('open');
}
function closeModal(){document.getElementById('api-modal').classList.remove('open')}

function copyText(t){navigator.clipboard?.writeText(t);event.target.textContent='Copied!';setTimeout(()=>{event.target.textContent='Copy'},1500)}

function quickLogin(e,p){
  window.open(`http://localhost:3000?demo=1&email=${encodeURIComponent(e)}&password=${encodeURIComponent(p)}`,'_blank');
}

function showTable(name){
  document.getElementById('modal-title').textContent='Table: '+name;
  document.getElementById('modal-body').innerHTML='<pre>Loading table data...</pre>';
  document.getElementById('api-modal').classList.add('open');
}

// Load logs
fetch(API.replace('/api','')+'/storage/logs/laravel.log',{headers:{'Authorization':'Bearer '+TOKEN}}).then(r=>r.text()).then(t=>{
  document.getElementById('log-content').textContent=t.slice(-3000)||'No logs found.';
}).catch(()=>{document.getElementById('log-content').textContent='Unable to load logs.'});

// Auto-refresh monitor
setInterval(()=>{
  if(document.getElementById('live-monitor').classList.contains('active')){
    document.getElementById('monitor-list').innerHTML='<div style="color:var(--dim)">Monitoring active — requests appear here in real-time</div>';
  }
},5000);
</script>
</body>
</html>
