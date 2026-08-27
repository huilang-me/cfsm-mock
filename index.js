/*
 * ============================================================
 * CF-Server-Monitor Mock Backend
 * ============================================================
 *
 * Single-file Cloudflare Worker
 *
 * NO:
 *   D1
 *   Durable Objects
 *   KV
 *   R2
 *
 * Public API:
 *
 *   GET  /api/config
 *   POST /api/theme_options
 *   GET  /api/servers
 *   GET  /api/server?id=mock-001
 *   GET  /api/history/all?id=mock-001&hours=24
 *
 * WebSocket:
 *
 *   GET /api/ws?subscribe=all
 *   GET /api/ws?subscribe=mock-001
 *
 * Mock:
 *
 *   40 servers by default
 *   env.NUMS controls output count, max 100
 *   100-server data pool
 *   100 countries
 *   12 servers per group
 *
 * WebSocket:
 *
 *   mock IDs < 8 = all WSS producers
 *
 *   subscribe=all
 *       client must send subscribe message
 *       only mock IDs < 8 produce updates
 *       1 second / update
 *
 *   subscribe=mock-001
 *       1 second / update
 *
 * CORS:
 *
 *   Environment variable:
 *
 *   CORS_ALLOWED_ORIGINS
 *
 * Example:
 *
 *   https://demo.huilang.me,https://huilang-me.github.io,https://localhost:8787,https://localhost:5173,https://localhost:3443
 *
 * ============================================================
 */


/* ============================================================
 * CONFIG
 * ========================================================== */

const WORKERS_VERSION = "2.7.12 Mock";
const AGENT_VERSION = "1.3.3 Mock";

const MOCK_WS_SERVER_ID = "mock-001";

const ALL_WS_SERVER_ID_LIMIT = 8;

const DEFAULT_SERVER_COUNT = 40;
const SERVERS_PER_GROUP = 12;

const LONG_HISTORY_POINTS = 120;

const LATENCY_WINDOW_POINTS = 20;
const LATENCY_WINDOW_HOURS = 2;


/* ============================================================
 * 100 COUNTRIES
 * ========================================================== */

const COUNTRY_POOL = [
  ["US", "United States", "New York"],
  ["CA", "Canada", "Toronto"],
  ["MX", "Mexico", "Mexico City"],
  ["BR", "Brazil", "Sao Paulo"],
  ["AR", "Argentina", "Buenos Aires"],
  ["CL", "Chile", "Santiago"],
  ["CO", "Colombia", "Bogota"],
  ["PE", "Peru", "Lima"],
  ["EC", "Ecuador", "Quito"],
  ["UY", "Uruguay", "Montevideo"],

  ["GB", "United Kingdom", "London"],
  ["IE", "Ireland", "Dublin"],
  ["FR", "France", "Paris"],
  ["DE", "Germany", "Frankfurt"],
  ["NL", "Netherlands", "Amsterdam"],
  ["BE", "Belgium", "Brussels"],
  ["LU", "Luxembourg", "Luxembourg"],
  ["CH", "Switzerland", "Zurich"],
  ["AT", "Austria", "Vienna"],
  ["ES", "Spain", "Madrid"],

  ["PT", "Portugal", "Lisbon"],
  ["IT", "Italy", "Milan"],
  ["GR", "Greece", "Athens"],
  ["SE", "Sweden", "Stockholm"],
  ["NO", "Norway", "Oslo"],
  ["DK", "Denmark", "Copenhagen"],
  ["FI", "Finland", "Helsinki"],
  ["IS", "Iceland", "Reykjavik"],
  ["PL", "Poland", "Warsaw"],
  ["CZ", "Czechia", "Prague"],

  ["SK", "Slovakia", "Bratislava"],
  ["HU", "Hungary", "Budapest"],
  ["RO", "Romania", "Bucharest"],
  ["BG", "Bulgaria", "Sofia"],
  ["HR", "Croatia", "Zagreb"],
  ["SI", "Slovenia", "Ljubljana"],
  ["RS", "Serbia", "Belgrade"],
  ["UA", "Ukraine", "Kyiv"],
  ["TR", "Turkey", "Istanbul"],
  ["GE", "Georgia", "Tbilisi"],

  ["AM", "Armenia", "Yerevan"],
  ["AZ", "Azerbaijan", "Baku"],
  ["KZ", "Kazakhstan", "Almaty"],
  ["UZ", "Uzbekistan", "Tashkent"],
  ["RU", "Russia", "Moscow"],
  ["IL", "Israel", "Tel Aviv"],
  ["AE", "United Arab Emirates", "Dubai"],
  ["SA", "Saudi Arabia", "Riyadh"],
  ["QA", "Qatar", "Doha"],
  ["KW", "Kuwait", "Kuwait City"],

  ["BH", "Bahrain", "Manama"],
  ["OM", "Oman", "Muscat"],
  ["JO", "Jordan", "Amman"],
  ["LB", "Lebanon", "Beirut"],
  ["EG", "Egypt", "Cairo"],
  ["MA", "Morocco", "Casablanca"],
  ["TN", "Tunisia", "Tunis"],
  ["DZ", "Algeria", "Algiers"],
  ["NG", "Nigeria", "Lagos"],
  ["GH", "Ghana", "Accra"],

  ["KE", "Kenya", "Nairobi"],
  ["ET", "Ethiopia", "Addis Ababa"],
  ["UG", "Uganda", "Kampala"],
  ["TZ", "Tanzania", "Dar es Salaam"],
  ["SN", "Senegal", "Dakar"],
  ["CI", "Ivory Coast", "Abidjan"],
  ["ZA", "South Africa", "Johannesburg"],
  ["MU", "Mauritius", "Port Louis"],
  ["IN", "India", "Mumbai"],
  ["PK", "Pakistan", "Karachi"],

  ["BD", "Bangladesh", "Dhaka"],
  ["LK", "Sri Lanka", "Colombo"],
  ["NP", "Nepal", "Kathmandu"],
  ["TH", "Thailand", "Bangkok"],
  ["VN", "Vietnam", "Ho Chi Minh City"],
  ["MY", "Malaysia", "Kuala Lumpur"],
  ["SG", "Singapore", "Singapore"],
  ["ID", "Indonesia", "Jakarta"],
  ["PH", "Philippines", "Manila"],
  ["KH", "Cambodia", "Phnom Penh"],

  ["LA", "Laos", "Vientiane"],
  ["MM", "Myanmar", "Yangon"],
  ["CN", "China", "Shanghai"],
  ["TW", "Taiwan", "Taipei"],
  ["JP", "Japan", "Tokyo"],
  ["KR", "South Korea", "Seoul"],
  ["MN", "Mongolia", "Ulaanbaatar"],
  ["AU", "Australia", "Sydney"],
  ["NZ", "New Zealand", "Auckland"],
  ["FJ", "Fiji", "Suva"],

  ["PG", "Papua New Guinea", "Port Moresby"],
  ["PA", "Panama", "Panama City"],
  ["CR", "Costa Rica", "San Jose"],
  ["GT", "Guatemala", "Guatemala City"],
  ["DO", "Dominican Republic", "Santo Domingo"],
  ["BO", "Bolivia", "La Paz"],
  ["PY", "Paraguay", "Asuncion"],
  ["HN", "Honduras", "Tegucigalpa"],
  ["NI", "Nicaragua", "Managua"],
  ["SV", "El Salvador", "San Salvador"],

  ["JM", "Jamaica", "Kingston"],
  ["TT", "Trinidad and Tobago", "Port of Spain"],
  ["BB", "Barbados", "Bridgetown"],
  ["BS", "Bahamas", "Nassau"],
  ["EE", "Estonia", "Tallinn"],
  ["LV", "Latvia", "Riga"],
  ["LT", "Lithuania", "Vilnius"],
  ["BA", "Bosnia and Herzegovina", "Sarajevo"],
  ["ME", "Montenegro", "Podgorica"],
  ["AL", "Albania", "Tirana"]
];


const MAP_PRIORITY_COUNTRY_CODES = [
  "US",
  "BR",
  "GB",
  "ZA",
  "IN",
  "SG",
  "JP",
  "AU",
  "CA",
  "MX",
  "AR",
  "EG",
  "DE",
  "AE",
  "TH",
  "NZ",
  "CL",
  "CO",
  "FR",
  "NG",
  "SA",
  "VN",
  "KR",
  "FJ",
  "PE",
  "PA",
  "ES",
  "KE",
  "IL",
  "ID",
  "CN",
  "KZ",
  "UY",
  "DO",
  "IT",
  "MA",
  "TR",
  "PH",
  "RU",
  "PG"
];


const MAP_PRIORITY_COUNTRY_SET =
  new Set(
    MAP_PRIORITY_COUNTRY_CODES
  );


const COUNTRIES = [
  ...MAP_PRIORITY_COUNTRY_CODES
    .map(
      code =>
        COUNTRY_POOL.find(
          country =>
            country[0] === code
        )
    )
    .filter(Boolean),

  ...COUNTRY_POOL.filter(
    country =>
      !MAP_PRIORITY_COUNTRY_SET.has(
        country[0]
      )
  )
];


/* ============================================================
 * UTILS
 * ========================================================== */

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

function round(value, digits = 2) {
  return Number(
    Number(value).toFixed(digits)
  );
}

function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}


function getServerIndexFromId(id) {
  const number =
    getMockServerNumber(id);

  return number === null
    ? 0
    : Math.max(
        0,
        number - 1
      );
}


function getLatencyTier(index) {
  if (
    [5, 11, 17, 23, 29, 35]
      .includes(index)
  ) {

    return "high";
  }

  if (
    [3, 8, 14, 20, 26, 32, 38]
      .includes(index)
  ) {

    return "medium";
  }

  return "normal";
}


function createLatencyMetrics(index) {
  const tier =
    getLatencyTier(index);

  const base =
    tier === "high"
      ? randInt(160, 300)
      : tier === "medium"
        ? randInt(70, 180)
        : randInt(10, 90);

  const max = 300;

  return {
    ping_ct:
      base,

    ping_cu:
      clamp(
        base + randInt(-10, 35),
        1,
        max
      ),

    ping_cm:
      clamp(
        base + randInt(-10, 45),
        1,
        max
      ),

    ping_bd:
      clamp(
        base + randInt(-10, 60),
        1,
        max
      )
  };
}


function randomLoss(
  chance,
  max
) {
  return Math.random() < chance
    ? round(
        rand(0.1, max),
        2
      )
    : 0;
}


function createLossMetrics(index) {
  const tier =
    getLatencyTier(index);

  const chance =
    tier === "high"
      ? 0.45
      : tier === "medium"
        ? 0.2
        : 0.05;

  const max =
    tier === "high"
      ? 4
      : tier === "medium"
        ? 2
        : 0.8;

  return {
    loss_ct:
      randomLoss(
        chance,
        max
      ),

    loss_cu:
      randomLoss(
        chance,
        max
      ),

    loss_cm:
      randomLoss(
        chance,
        max + 0.8
      ),

    loss_bd:
      randomLoss(
        chance,
        max + 0.8
      )
  };
}


/* ============================================================
 * CORS
 * ========================================================== */

function getAllowedOrigins(env) {
  return String(
    env?.CORS_ALLOWED_ORIGINS || ""
  )
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);
}


function isAllowedOrigin(request, env) {
  const origin =
    request.headers.get("Origin");

  /*
   * curl / server-side request / non-browser
   * does not have Origin.
   */

  if (!origin) {
    return true;
  }

  return getAllowedOrigins(env)
    .includes(origin);
}


function corsHeaders(request, env) {
  const origin =
    request.headers.get("Origin");

  const headers = {
    "Vary": "Origin"
  };

  if (
    origin &&
    getAllowedOrigins(env)
      .includes(origin)
  ) {
    headers[
      "Access-Control-Allow-Origin"
    ] = origin;

    headers[
      "Access-Control-Allow-Methods"
    ] = "GET, POST, OPTIONS";

    headers[
      "Access-Control-Allow-Headers"
    ] =
      "Content-Type, Authorization, X-Turnstile-Token, X-Turnstile-Verified";

    headers[
      "Access-Control-Allow-Credentials"
    ] = "true";

    headers[
      "Access-Control-Max-Age"
    ] = "86400";
  }

  return headers;
}


function json(
  request,
  env,
  data,
  status = 200
) {
  return new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",

        ...corsHeaders(
          request,
          env
        )
      }
    }
  );
}


function error(
  request,
  env,
  message,
  status
) {
  return json(
    request,
    env,
    {
      error: message,
      code: status
    },
    status
  );
}


/* ============================================================
 * CPU / OS DATA
 * ========================================================== */

const CPU_MODELS = [
  ["Intel Xeon Gold 6230", 20],
  ["Intel Xeon E-2386G", 6],
  ["Intel Xeon E5-2680 v4", 14],
  ["AMD EPYC 7B12", 8],
  ["AMD EPYC 7763", 32],
  ["AMD EPYC 7282", 16],
  ["AMD Ryzen 9 5950X", 16],
  ["AMD Ryzen 7 5800X", 8],
  ["Intel Core i7-12700K", 12],
  ["Intel Core i9-13900K", 24]
];


const OS_LIST = [
  ["Ubuntu 24.04", "6.8.0-generic"],
  ["Ubuntu 22.04", "6.5.0-generic"],
  ["Debian 12", "6.1.0-amd64"],
  ["Debian 11", "5.10.0-amd64"],
  ["Alpine 3.20", "6.6.0-virt"],
  ["Rocky Linux 9", "5.14.0-el9"],
  ["AlmaLinux 9", "5.14.0-el9"]
];


const RAM_LIST = [
  2048,
  4096,
  8192,
  16384,
  32768,
  65536
];


const DISK_LIST = [
  51200,
  102400,
  204800,
  512000,
  1024000
];


/* ============================================================
 * DISK
 * ========================================================== */

function createDisk() {
  return {
    read_bps:
      randInt(
        1024,
        10 * 1024 * 1024
      ),

    write_bps:
      randInt(
        1024,
        10 * 1024 * 1024
      ),

    read_iops:
      randInt(10, 1000),

    write_iops:
      randInt(10, 1000),

    await_ms:
      round(
        rand(0.2, 8),
        2
      ),

    util:
      round(
        rand(1, 50),
        2
      )
  };
}


/* ============================================================
 * SERVER GROUP
 * ========================================================== */

function getServerGroup(index) {
  return `Group ${String(
    Math.floor(index / SERVERS_PER_GROUP) + 1
  ).padStart(2, "0")}`;
}


/* ============================================================
 * SERVER CREATION
 * ========================================================== */

function createServer(
  country,
  index
) {
  const [
    countryCode,
    countryName,
    city
  ] = country;


  const [
    cpuInfo,
    cpuCores
  ] =
    CPU_MODELS[
      index %
      CPU_MODELS.length
    ];


  const [
    os,
    kernel
  ] =
    OS_LIST[
      index %
      OS_LIST.length
    ];


  const ramTotal =
    RAM_LIST[
      index %
      RAM_LIST.length
    ];


  const diskTotal =
    DISK_LIST[
      index %
      DISK_LIST.length
    ];


  const now =
    Date.now();


  const cpu =
    round(
      rand(5, 70)
    );


  const ramUsed =
    Math.round(
      ramTotal *
      rand(0.2, 0.7)
    );


  const diskUsed =
    Math.round(
      diskTotal *
      rand(0.15, 0.7)
    );


  const latency =
    createLatencyMetrics(index);


  const loss =
    createLossMetrics(index);


  /*
   * Real protocol uses gpu_info as JSON string
   * for REST Server data.
   */

  const gpuInfo =
    index % 10 === 0
      ? JSON.stringify([
          {
            id: "0",
            name:
              "NVIDIA RTX 3060",
            info:
              round(
                rand(5, 80),
                1
              )
          }
        ])
      : "[]";


  return {

    id:
      `mock-${String(
        index + 1
      ).padStart(3, "0")}`,

    name:
      `${countryCode}-${String(
        index + 1
      ).padStart(3, "0")}`,

    server_group:
      getServerGroup(index),

    tags:
      `mock,${countryCode.toLowerCase()}`,

    price:
      "0.00",

    billing_cycle:
      "month",

    auto_renewal:
      "0",

    currency:
      "USD",

    expire_date:
      "2099-12-31",

    traffic_limit:
      "10240",

    traffic_calc_type:
      "total",

    reset_day:
      1,

    report_interval:
      60,

    wss_report_interval:
      index < ALL_WS_SERVER_ID_LIMIT - 1
        ? 1
        : 0,

    is_hidden:
      "0",

    sort_order:
      index,

    country:
      countryName,

    city,

    cpu,

    load_avg:
      `${round(
        cpu / cpuCores,
        2
      )} ` +
      `${round(
        cpu / cpuCores * 0.9,
        2
      )} ` +
      `${round(
        cpu / cpuCores * 1.1,
        2
      )}`,

    net_in_speed:
      randInt(
        10 * 1024,
        50 * 1024 * 1024
      ),

    net_out_speed:
      randInt(
        10 * 1024,
        30 * 1024 * 1024
      ),

    net_rx:
      randInt(
        1 * 1024 * 1024 * 1024,
        100 *
          1024 *
          1024 *
          1024
      ),

    net_tx:
      randInt(
        1 * 1024 * 1024 * 1024,
        100 *
          1024 *
          1024 *
          1024
      ),

    net_rx_monthly:
      randInt(
        100 *
          1024 *
          1024 *
          1024,
        3 *
          1024 *
          1024 *
          1024 *
          1024
      ),

    net_tx_monthly:
      randInt(
        100 *
          1024 *
          1024 *
          1024,
        3 *
          1024 *
          1024 *
          1024 *
          1024
      ),

    processes:
      randInt(80, 500),

    tcp_conn:
      randInt(10, 500),

    udp_conn:
      randInt(0, 100),

    ping_ct:
      latency.ping_ct,

    ping_cu:
      latency.ping_cu,

    ping_cm:
      latency.ping_cm,

    ping_bd:
      latency.ping_bd,

    loss_ct:
      loss.loss_ct,

    loss_cu:
      loss.loss_cu,

    loss_cm:
      loss.loss_cm,

    loss_bd:
      loss.loss_bd,

    ram_total:
      ramTotal,

    ram_used:
      ramUsed,

    swap_total:
      2048,

    swap_used:
      randInt(0, 512),

    disk_total:
      diskTotal,

    disk_used:
      diskUsed,

    disk:
      createDisk(),

    cpu_cores:
      cpuCores,

    cpu_info:
      cpuInfo,

    gpu_info:
      gpuInfo,

    arch:
      "x86_64",

    os,

    kernel_version:
      kernel,

    /*
     * Keep country code as region.
     */

    region:
      countryCode,

    ip_v4:
      "1",

    ip_v6:
      index % 4 === 0
        ? "0"
        : "1",

    boot_time:
      String(
        now -
          randInt(
            1,
            180
          ) *
          86400000
      ),

    last_updated:
      now,

    timestamp:
      now,

    agent_version:
      AGENT_VERSION
  };
}


/* ============================================================
 * CREATE SERVER POOL
 * ========================================================== */

const SERVERS =
  COUNTRIES.map(
    (country, index) =>
      createServer(
        country,
        index
      )
  );


function getServerCount(env) {
  const configured =
    Number.parseInt(
      env?.NUMS ??
      "",
      10
    );

  if (
    !Number.isFinite(
      configured
    )
  ) {

    return DEFAULT_SERVER_COUNT;
  }

  return clamp(
    configured,
    1,
    SERVERS.length
  );
}


function getServers(env) {
  return SERVERS.slice(
    0,
    getServerCount(env)
  );
}


function getServerGroups(env) {
  return Array.from(
    new Set(
      getServers(env).map(
        server =>
          server.server_group
      )
    )
  );
}


function getMockServerNumber(id) {
  const match =
    /^mock-(\d+)$/.exec(
      id
    );

  return match
    ? Number.parseInt(
        match[1],
        10
      )
    : null;
}


function getAllWsServers(
  servers,
  ids = null
) {

  const requestedIds =
    Array.isArray(ids)
      ? new Set(ids)
      : null;

  return servers.filter(
    server => {
      const number =
        getMockServerNumber(
          server.id
        );

      return (
        number !== null &&
        number > 0 &&
        number < ALL_WS_SERVER_ID_LIMIT &&
        (
          !requestedIds ||
          requestedIds.has(
            server.id
          )
        )
      );
    }
  );
}


/* ============================================================
 * UPDATE SERVER
 * ========================================================== */

function updateServer(server) {

  const now =
    Date.now();


  server.cpu =
    round(
      clamp(
        server.cpu +
          rand(-10, 10),
        1,
        98
      )
    );


  server.ram_used =
    Math.round(
      server.ram_total *
      rand(0.2, 0.85)
    );


  server.swap_used =
    randInt(
      0,
      Math.floor(
        server.swap_total *
        0.5
      )
    );


  server.net_in_speed =
    randInt(
      10 * 1024,
      100 * 1024 * 1024
    );


  server.net_out_speed =
    randInt(
      10 * 1024,
      80 * 1024 * 1024
    );


  server.net_rx +=
    server.net_in_speed;


  server.net_tx +=
    server.net_out_speed;

  server.net_rx_monthly +=
    server.net_in_speed;


  server.net_tx_monthly +=
    server.net_out_speed;


  server.processes =
    Math.max(
      30,
      server.processes +
        randInt(-15, 15)
    );


  server.tcp_conn =
    Math.max(
      1,
      server.tcp_conn +
        randInt(-30, 30)
    );


  server.udp_conn =
    Math.max(
      0,
      server.udp_conn +
        randInt(-10, 10)
    );


  const index =
    getServerIndexFromId(
      server.id
    );


  const latency =
    createLatencyMetrics(index);


  const loss =
    createLossMetrics(index);


  server.ping_ct =
    latency.ping_ct;


  server.ping_cu =
    latency.ping_cu;


  server.ping_cm =
    latency.ping_cm;


  server.ping_bd =
    latency.ping_bd;


  server.loss_ct =
    loss.loss_ct;


  server.loss_cu =
    loss.loss_cu;


  server.loss_cm =
    loss.loss_cm;


  server.loss_bd =
    loss.loss_bd;


  server.disk =
    createDisk();


  const load =
    server.cpu /
    Math.max(
      server.cpu_cores,
      1
    );


  server.load_avg =
    `${round(load, 2)} ` +
    `${round(
      load * rand(0.8, 1.2),
      2
    )} ` +
    `${round(
      load * rand(0.7, 1.3),
      2
    )}`;


  server.last_updated =
    now;

  server.timestamp =
    now;


  return server;
}


/* ============================================================
 * LATENCY HISTORY
 * ========================================================== */

function createLatencyHistory(server) {

  const result = [];

  const index =
    getServerIndexFromId(
      server.id
    );

  const now =
    Date.now();

  const start =
    now -
    LATENCY_WINDOW_HOURS *
      60 *
      60 *
      1000;

  const interval =
    (now - start) /
    (LATENCY_WINDOW_POINTS - 1);


  for (
    let i = 0;
    i < LATENCY_WINDOW_POINTS;
    i++
  ) {

    const ts =
      Math.round(
        start +
          i * interval
      );


    const latency =
      createLatencyMetrics(index);


    result.push({

      ts,

      ct:
        latency.ping_ct,

      cu:
        latency.ping_cu,

      cm:
        latency.ping_cm,

      bd:
        latency.ping_bd
    });
  }


  return result;
}


/* ============================================================
 * LOSS HISTORY
 * ========================================================== */

function createLossHistory(server) {

  const result = [];

  const index =
    getServerIndexFromId(
      server.id
    );

  const now =
    Date.now();

  const start =
    now -
    LATENCY_WINDOW_HOURS *
      60 *
      60 *
      1000;

  const interval =
    (now - start) /
    (LATENCY_WINDOW_POINTS - 1);


  for (
    let i = 0;
    i < LATENCY_WINDOW_POINTS;
    i++
  ) {

    const ts =
      Math.round(
        start +
          i * interval
      );


    const loss =
      createLossMetrics(index);


    result.push({

      ts,

      ct:
        loss.loss_ct,

      cu:
        loss.loss_cu,

      cm:
        loss.loss_cm,

      bd:
        loss.loss_bd
    });
  }


  return result;
}


/* ============================================================
 * /api/config
 * ========================================================== */

let themeOptions = {};


function handleConfig(
  request,
  env
) {

  return json(
    request,
    env,
    {
      version:
        WORKERS_VERSION,

      /*
       * Mock backend is public.
       */

      is_public:
        true,

      authorization:
        false,

      turnstile_enabled:
        false,

      turnstile_login_enabled:
        false,

      turnstile_site_key:
        "",

      site_title:
        "CF-Server-Monitor 演示站",

      theme_options:
        themeOptions,

      verified:
        false,

      turnstile_verified:
        null,

      frontend_ws_timeout_minutes:
        0,

      long_history_points:
        LONG_HISTORY_POINTS,

      latency_window:
        {
          points:
            LATENCY_WINDOW_POINTS,

          hours:
            LATENCY_WINDOW_HOURS
        }
    }
  );
}


/* ============================================================
 * /api/theme_options
 * ========================================================== */

async function handleThemeOptions(
  request,
  env
) {

  let body;

  try {

    body =
      await request.json();

  } catch {

    return error(
      request,
      env,
      "invalidThemeOptionsFormat",
      400
    );
  }


  if (
    !body ||
    typeof body.theme_options !==
      "object" ||
    body.theme_options === null ||
    Array.isArray(
      body.theme_options
    )
  ) {

    return error(
      request,
      env,
      "invalidThemeOptionsFormat",
      400
    );
  }


  themeOptions =
    body.theme_options;


  return json(
    request,
    env,
    {
      success:
        true,

      theme_options:
        themeOptions,

      message:
        "updateSuccess"
    }
  );
}


/* ============================================================
 * /api/servers
 * ========================================================== */

function handleServers(
  request,
  env
) {

  const servers =
    getServers(env).map(
      server => {

        updateServer(
          server
        );


        const item =
          clone(server);


        /*
         * Protocol:
         *
         * ping/loss ONLY exist in
         * /api/servers.
         */

        item.ping =
          createLatencyHistory(
            server
          );

        item.loss =
          createLossHistory(
            server
          );


        return item;
      }
    );


  let globalSpeedIn = 0;
  let globalSpeedOut = 0;
  let globalNetTx = 0;
  let globalNetRx = 0;


  for (
    const server of servers
  ) {

    globalSpeedIn +=
      Number(
        server.net_in_speed ||
        0
      );

    globalSpeedOut +=
      Number(
        server.net_out_speed ||
        0
      );

    globalNetTx +=
      Number(
        server.net_tx ||
        0
      );

    globalNetRx +=
      Number(
        server.net_rx ||
        0
      );
  }


  /*
   * Protocol's regionStats:
   *
   * count by region/country.
   */

  const regionStats = {};

  for (
    const server of servers
  ) {

    const region =
      server.region;

    regionStats[region] =
      (
        regionStats[region] ||
        0
      ) + 1;
  }


  /*
   * Additional mock-only groupStats.
   */

  const groupStats = {};

  for (
    const server of servers
  ) {

    const group =
      server.server_group;

    groupStats[group] =
      (
        groupStats[group] ||
        0
      ) + 1;
  }


  return json(
    request,
    env,
    {

      servers,

      stats:
        {
          total:
            servers.length,

          online:
            servers.length,

          offline:
            0,

          globalSpeedIn,

          globalSpeedOut,

          globalNetTx,

          globalNetRx
        },

      /*
       * Protocol-compatible regionStats.
       */

      regionStats,

      groupStats,

      sysConfig:
        {
          show_price:
            true,

          show_expire:
            true,

          show_tf:
            true,

          show_three_net_details:
            true
        }
    }
  );
}


function parseGpuInfo(
  value
) {

  try {

    const parsed =
      JSON.parse(
        value || "[]"
      );

    return Array.isArray(
      parsed
    )
      ? parsed
      : [];

  } catch {

    return [];
  }
}


/* ============================================================
 * /api/server
 * ========================================================== */

function handleServer(
  request,
  env
) {

  const url =
    new URL(
      request.url
    );


  const id =
    url.searchParams.get(
      "id"
    );


  if (!id) {

    return error(
      request,
      env,
      "Missing ID",
      400
    );
  }


  const server =
    getServers(env).find(
      item =>
        item.id === id
    );


  if (!server) {

    return error(
      request,
      env,
      "Server not found",
      404
    );
  }


  updateServer(
    server
  );


  /*
   * No ping/loss window here.
   *
   * Protocol explicitly says these
   * only appear in /api/servers.
   */

  const result =
    clone(server);


  result.sysConfig =
    {
      long_history_points:
        LONG_HISTORY_POINTS
    };


  return json(
    request,
    env,
    result
  );
}


/* ============================================================
 * HISTORY
 * ========================================================== */

function createHistory(
  server,
  hours
) {

  const result = [];

  const now =
    Date.now();

  const start =
    now -
    hours *
      60 *
      60 *
      1000;

  const interval =
    (now - start) /
    Math.max(
      LONG_HISTORY_POINTS - 1,
      1
    );


  for (
    let i = 0;
    i < LONG_HISTORY_POINTS;
    i++
  ) {

    const timestamp =
      Math.round(
        start +
          i * interval
      );


    const cpu =
      round(
        rand(5, 75)
      );


    const ramUsed =
      Math.round(
        server.ram_total *
        rand(0.2, 0.8)
      );


    const swapUsed =
      randInt(
        0,
        Math.floor(
          server.swap_total *
          0.5
        )
      );


    const netInSpeed =
      randInt(
        10 * 1024,
        100 * 1024 * 1024
      );


    const netOutSpeed =
      randInt(
        10 * 1024,
        80 * 1024 * 1024
      );


    const pointOffset =
      LONG_HISTORY_POINTS -
      i;


    const netRx =
      Math.max(
        0,
        server.net_rx -
          netInSpeed *
          pointOffset
      );


    const netTx =
      Math.max(
        0,
        server.net_tx -
          netOutSpeed *
          pointOffset
      );


    const netRxMonthly =
      Math.max(
        0,
        server.net_rx_monthly -
          netInSpeed *
          pointOffset
      );


    const netTxMonthly =
      Math.max(
        0,
        server.net_tx_monthly -
          netOutSpeed *
          pointOffset
      );


    const index =
      getServerIndexFromId(
        server.id
      );


    const latency =
      createLatencyMetrics(index);


    const loss =
      createLossMetrics(index);


    const load =
      cpu /
      Math.max(
        server.cpu_cores,
        1
      );


    const loadAvg =
      `${round(load, 2)} ` +
      `${round(
        load * rand(0.8, 1.2),
        2
      )} ` +
      `${round(
        load * rand(0.7, 1.3),
        2
      )}`;


    const disk =
      createDisk();


    result.push({

      timestamp,

      cpu,

      /*
       * Protocol allows historical gpu_info
       * as JSON string.
       */

      gpu_info:
        server.gpu_info,

      ram_total:
        server.ram_total,

      ram_used:
        ramUsed,

      swap_total:
        server.swap_total,

      swap_used:
        swapUsed,

      disk_total:
        server.disk_total,

      disk_used:
        server.disk_used,

      disk_read_bps:
        disk.read_bps,

      disk_write_bps:
        disk.write_bps,

      disk_read_iops:
        disk.read_iops,

      disk_write_iops:
        disk.write_iops,

      disk_await_ms:
        disk.await_ms,

      disk_util:
        disk.util,

      disk,

      processes:
        randInt(80, 500),

      net_in_speed:
        netInSpeed,

      net_out_speed:
        netOutSpeed,

      net_rx:
        netRx,

      net_tx:
        netTx,

      net_rx_monthly:
        netRxMonthly,

      net_tx_monthly:
        netTxMonthly,

      tcp_conn:
        randInt(10, 500),

      udp_conn:
        randInt(0, 100),

      ping_ct:
        latency.ping_ct,

      ping_cu:
        latency.ping_cu,

      ping_cm:
        latency.ping_cm,

      ping_bd:
        latency.ping_bd,

      loss_ct:
        loss.loss_ct,

      loss_cu:
        loss.loss_cu,

      loss_cm:
        loss.loss_cm,

      loss_bd:
        loss.loss_bd,

      load_avg:
        loadAvg,

      region:
        server.region,

      kernel_version:
        server.kernel_version,

      boot_time:
        server.boot_time
    });
  }


  return result;
}


/* ============================================================
 * /api/history/all
 * ========================================================== */

function handleHistory(
  request,
  env
) {

  const url =
    new URL(
      request.url
    );


  const id =
    url.searchParams.get(
      "id"
    );


  if (!id) {

    return error(
      request,
      env,
      "Missing ID",
      400
    );
  }


  const server =
    getServers(env).find(
      item =>
        item.id === id
    );


  if (!server) {

    return error(
      request,
      env,
      "Server not found",
      404
    );
  }


  let hours =
    Number(
      url.searchParams.get(
        "hours"
      ) ||
      "24"
    );


  const allowedHours = [
    0.167,
    0.5,
    1,
    6,
    12,
    24,
    48,
    96,
    168
  ];


  if (
    !Number.isFinite(hours)
  ) {
    hours = 24;
  }


  /*
   * Mock doesn't require JWT,
   * therefore hours > 24 is also allowed.
   *
   * The data is fake anyway.
   */

  let closest =
    allowedHours[0];


  for (
    const value of allowedHours
  ) {

    if (
      Math.abs(
        value - hours
      ) <
      Math.abs(
        closest - hours
      )
    ) {

      closest =
        value;
    }
  }


  /*
   * IMPORTANT:
   *
   * Return array directly.
   */

  return json(
    request,
    env,
    createHistory(
      server,
      closest
    )
  );
}


/* ============================================================
 * WEBSOCKET DATA
 * ========================================================== */

function createRealtimeData(
  server
) {

  updateServer(
    server
  );


  return {

    cpu:
      server.cpu,

    load_avg:
      server.load_avg,

    ram_total:
      server.ram_total,

    ram_used:
      server.ram_used,

    swap_total:
      server.swap_total,

    swap_used:
      server.swap_used,

    net_in_speed:
      server.net_in_speed,

    net_out_speed:
      server.net_out_speed,

    net_rx:
      server.net_rx,

    net_tx:
      server.net_tx,

    net_rx_monthly:
      server.net_rx_monthly,

    net_tx_monthly:
      server.net_tx_monthly,

    processes:
      server.processes,

    tcp_conn:
      server.tcp_conn,

    udp_conn:
      server.udp_conn,

    ping_ct:
      server.ping_ct,

    ping_cu:
      server.ping_cu,

    ping_cm:
      server.ping_cm,

    ping_bd:
      server.ping_bd,

    loss_ct:
      server.loss_ct,

    loss_cu:
      server.loss_cu,

    loss_cm:
      server.loss_cm,

    loss_bd:
      server.loss_bd,

    disk_total:
      server.disk_total,

    disk_used:
      server.disk_used,

    disk:
      server.disk,

    /*
     * WebSocket protocol:
     * gpu_info is array.
     */

    gpu_info:
      parseGpuInfo(
        server.gpu_info
      ),

    cpu_cores:
      server.cpu_cores,

    cpu_info:
      server.cpu_info,

    arch:
      server.arch,

    os:
      server.os,

    kernel_version:
      server.kernel_version,

    region:
      server.region,

    ip_v4:
      server.ip_v4,

    ip_v6:
      server.ip_v6,

    boot_time:
      server.boot_time,

    agent_version:
      server.agent_version,

    last_updated:
      server.last_updated,

    sample_timestamp:
      server.timestamp,

    timestamp:
      server.timestamp
  };
}


/* ============================================================
 * BATCH UPDATE
 * ========================================================== */

function createBatchUpdate(
  value
) {

  const servers =
    Array.isArray(value)
      ? value
      : [value];


  return {

    type:
      "batchUpdate",

    ts:
      Date.now(),

    updates:
      servers.map(
        server => ({

          serverId:
            server.id,

          samples:
            [
              {

                ts:
                  Date.now(),

                payload:
                  createRealtimeData(
                    server
                  )
              }
            ]
        })
      )
  };
}


function createSubscribedMessage(
  server
) {

  return {

    type:
      "subscribed",

    ts:
      Date.now(),

    subscribed:
      server.id,

    count:
      1
  };
}


function createAllSubscribedMessage(
  count
) {

  return {

    type:
      "subscribed",

    ts:
      Date.now(),

    subscribed:
      "all",

    count
  };
}


/* ============================================================
 * WEBSOCKET
 * ========================================================== */

function handleWebSocket(
  request,
  env
) {

  const url =
    new URL(
      request.url
    );


  const subscribe =
    url.searchParams.get(
      "subscribe"
    ) ||
    "all";


  const servers =
    getServers(env);


  const baseServer =
    servers.find(
      item =>
        item.id ===
        MOCK_WS_SERVER_ID
    );


  if (!baseServer) {

    return new Response(
      "Mock server unavailable",
      {
        status: 503
      }
    );
  }


  const isAllSubscription =
    subscribe === "all";


  const server =
    isAllSubscription
      ? baseServer
      : (
          servers.find(
            item =>
              item.id === subscribe
          ) ||
          {
            ...clone(
              baseServer
            ),
            id:
              subscribe
          }
        );


  const allServers =
    getAllWsServers(
      servers
    );


  /*
   * Upgrade must be websocket.
   */

  if (
    request.headers
      .get("Upgrade")
      ?.toLowerCase() !==
    "websocket"
  ) {

    return json(
      request,
      env,
      isAllSubscription
        ? [
            createAllSubscribedMessage(
              allServers.length
            ),
            createBatchUpdate(
              allServers
            )
          ]
        : [
            createSubscribedMessage(
              server
            ),
            createBatchUpdate(
              server
            )
          ]
    );
  }


  const pair =
    new WebSocketPair();


  const client =
    pair[0];

  const socket =
    pair[1];


  socket.accept();


  let closed =
    false;


  let timer =
    null;


  let updateServers =
    isAllSubscription
      ? []
      : [server];


  function stopTimer() {

    if (
      timer !== null
    ) {

      clearInterval(
        timer
      );

      timer =
        null;
    }
  }


  function closeSocket(
    code = 1000,
    reason = ""
  ) {

    if (closed) {
      return;
    }


    closed =
      true;


    stopTimer();


    try {

      socket.close(
        code,
        reason
      );

    } catch {}
  }


  /*
   * Initial acknowledgement.
   */

  try {

    socket.send(
      JSON.stringify(
        isAllSubscription
          ? {
              type:
                "hello",

              ts:
                Date.now(),

              subscribed:
                "all"
            }
          : createSubscribedMessage(
              server
            )
        )
    );

  } catch {

    closeSocket(
      1011,
      "subscribe failed"
    );

    return new Response(
      null,
      {
        status: 101,
        webSocket:
          client
      }
    );
  }


  /*
   * Send update.
   */

  function sendUpdate() {

    if (
      closed ||
      updateServers.length < 1
    ) {
      return;
    }


    try {

      socket.send(
        JSON.stringify(
          createBatchUpdate(
            updateServers
          )
        )
      );

    } catch {

      closeSocket(
        1000,
        "send failed"
      );
    }
  }


  if (
    !isAllSubscription
  ) {

    sendUpdate();

    timer =
      setInterval(
        sendUpdate,
        1000
      );
  }


  /* ========================================================
   * MESSAGE
   * ====================================================== */

  socket.addEventListener(
    "message",
    event => {

      if (closed) {
        return;
      }


      let message;


      try {

        message =
          JSON.parse(
            event.data
          );

      } catch {

        closeSocket(
          1008,
          "Invalid JSON"
        );

        return;
      }


      /* ----------------------------------------------------
       * ping
       * -------------------------------------------------- */

      if (
        message.type ===
        "ping"
      ) {

        try {

          socket.send(
            JSON.stringify({

              type:
                "pong",

              ts:
                Date.now()
            })
          );

        } catch {}

        return;
      }


      /* ----------------------------------------------------
       * subscribe
       * -------------------------------------------------- */

      if (
        message.type ===
        "subscribe"
      ) {

        if (
          !isAllSubscription
        ) {

          try {

            socket.send(
              JSON.stringify(
                createSubscribedMessage(
                  server
                )
              )
            );

          } catch {}

          return;
        }


        if (
          message.scope !== "all" ||
          !Array.isArray(
            message.ids
          )
        ) {

          closeSocket(
            1008,
            "Invalid subscribe"
          );

          return;
        }


        if (
          message.ids.length >
          500
        ) {

          closeSocket(
            1008,
            "Too many ids"
          );

          return;
        }


        for (
          const id of message.ids
        ) {

          if (
            typeof id !== "string" ||
            id.length < 1 ||
            id.length > 64 ||
            !/^[A-Za-z0-9._:-]+$/
              .test(id)
          ) {

            closeSocket(
              1008,
              "Invalid ids"
            );

            return;
          }
        }


        updateServers =
          getAllWsServers(
            servers,
            message.ids
          );


        stopTimer();


        try {

          socket.send(
            JSON.stringify(
              createAllSubscribedMessage(
                updateServers.length
              )
            )
          );

        } catch {}

        if (
          updateServers.length > 0
        ) {

          sendUpdate();

          timer =
            setInterval(
              sendUpdate,
              1000
            );
        }

        return;
      }
    }
  );


  /* ========================================================
   * CLOSE
   * ====================================================== */

  socket.addEventListener(
    "close",
    () => {

      closed =
        true;

      stopTimer();
    }
  );


  /* ========================================================
   * ERROR
   * ====================================================== */

  socket.addEventListener(
    "error",
    () => {

      closed =
        true;

      stopTimer();
    }
  );


  return new Response(
    null,
    {
      status: 101,

      webSocket:
        client
    }
  );
}


/* ============================================================
 * ROOT
 * ========================================================== */

function handleRoot(
  request,
  env
) {

  const serverCount =
    getServerCount(env);


  return json(
    request,
    env,
    {

      name:
        "CF-Server-Monitor Mock",

      version:
        WORKERS_VERSION,

      servers:
        serverCount,

      max_servers:
        SERVERS.length,

      countries:
        COUNTRIES.length,

      groups:
        getServerGroups(env),

      websocket:
        {

          endpoint:
            "/api/ws",

          all:
            "/api/ws?subscribe=all",

          single:
            "/api/ws?subscribe=mock-001",

          mockServer:
            MOCK_WS_SERVER_ID,

          allInterval:
            1000,

          singleInterval:
            1000
        },

      storage:
        "none",

      d1:
        false,

      durable_objects:
        false,

      kv:
        false,

      r2:
        false
    }
  );
}


/* ============================================================
 * MAIN FETCH
 * ========================================================== */

export default {

  async fetch(
    request,
    env,
    ctx
  ) {

    const url =
      new URL(
        request.url
      );


    /* ========================================================
     * CORS
     * ====================================================== */

    const origin =
      request.headers.get(
        "Origin"
      );


    if (
      origin &&
      !isAllowedOrigin(
        request,
        env
      )
    ) {

      return new Response(
        JSON.stringify({

          error:
            "CORS origin not allowed",

          code:
            403
        }),
        {

          status:
            403,

          headers: {

            "Content-Type":
              "application/json; charset=UTF-8",

            "Vary":
              "Origin"
          }
        }
      );
    }


    /* ========================================================
     * OPTIONS
     * ====================================================== */

    if (
      request.method ===
      "OPTIONS"
    ) {

      return new Response(
        null,
        {

          status:
            204,

          headers:
            corsHeaders(
              request,
              env
            )
        }
      );
    }


    /* ========================================================
     * WEBSOCKET
     * ====================================================== */

    if (
      url.pathname ===
        "/api/ws" &&
      request.method ===
        "GET"
    ) {

      return handleWebSocket(
        request,
        env
      );
    }


    /* ========================================================
     * /api/config
     * ====================================================== */

    if (
      url.pathname ===
        "/api/config" &&
      request.method ===
        "GET"
    ) {

      return handleConfig(
        request,
        env
      );
    }


    /* ========================================================
     * /api/theme_options
     * ====================================================== */

    if (
      url.pathname ===
        "/api/theme_options" &&
      request.method ===
        "POST"
    ) {

      return handleThemeOptions(
        request,
        env
      );
    }


    /* ========================================================
     * /api/servers
     * ====================================================== */

    if (
      url.pathname ===
        "/api/servers" &&
      request.method ===
        "GET"
    ) {

      return handleServers(
        request,
        env
      );
    }


    /* ========================================================
     * /api/server
     * ====================================================== */

    if (
      url.pathname ===
        "/api/server" &&
      request.method ===
        "GET"
    ) {

      return handleServer(
        request,
        env
      );
    }


    /* ========================================================
     * /api/history/all
     * ====================================================== */

    if (
      url.pathname ===
        "/api/history/all" &&
      request.method ===
        "GET"
    ) {

      return handleHistory(
        request,
        env
      );
    }


    /* ========================================================
     * ROOT
     * ====================================================== */

    if (
      url.pathname ===
      "/"
    ) {

      return handleRoot(
        request,
        env
      );
    }


    /* ========================================================
     * 404
     * ====================================================== */

    return error(
      request,
      env,
      "Not found",
      404
    );
  }
};
