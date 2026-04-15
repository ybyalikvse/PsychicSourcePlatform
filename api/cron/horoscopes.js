import { createRequire } from 'module'; const require = createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except2, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except2)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/dotenv/package.json
var require_package = __commonJS({
  "node_modules/dotenv/package.json"(exports, module) {
    module.exports = {
      name: "dotenv",
      version: "16.6.1",
      description: "Loads environment variables from .env file",
      main: "lib/main.js",
      types: "lib/main.d.ts",
      exports: {
        ".": {
          types: "./lib/main.d.ts",
          require: "./lib/main.js",
          default: "./lib/main.js"
        },
        "./config": "./config.js",
        "./config.js": "./config.js",
        "./lib/env-options": "./lib/env-options.js",
        "./lib/env-options.js": "./lib/env-options.js",
        "./lib/cli-options": "./lib/cli-options.js",
        "./lib/cli-options.js": "./lib/cli-options.js",
        "./package.json": "./package.json"
      },
      scripts: {
        "dts-check": "tsc --project tests/types/tsconfig.json",
        lint: "standard",
        pretest: "npm run lint && npm run dts-check",
        test: "tap run --allow-empty-coverage --disable-coverage --timeout=60000",
        "test:coverage": "tap run --show-full-coverage --timeout=60000 --coverage-report=text --coverage-report=lcov",
        prerelease: "npm test",
        release: "standard-version"
      },
      repository: {
        type: "git",
        url: "git://github.com/motdotla/dotenv.git"
      },
      homepage: "https://github.com/motdotla/dotenv#readme",
      funding: "https://dotenvx.com",
      keywords: [
        "dotenv",
        "env",
        ".env",
        "environment",
        "variables",
        "config",
        "settings"
      ],
      readmeFilename: "README.md",
      license: "BSD-2-Clause",
      devDependencies: {
        "@types/node": "^18.11.3",
        decache: "^4.6.2",
        sinon: "^14.0.1",
        standard: "^17.0.0",
        "standard-version": "^9.5.0",
        tap: "^19.2.0",
        typescript: "^4.8.4"
      },
      engines: {
        node: ">=12"
      },
      browser: {
        fs: false
      }
    };
  }
});

// node_modules/dotenv/lib/main.js
var require_main = __commonJS({
  "node_modules/dotenv/lib/main.js"(exports, module) {
    var fs = __require("fs");
    var path2 = __require("path");
    var os = __require("os");
    var crypto2 = __require("crypto");
    var packageJson = require_package();
    var version2 = packageJson.version;
    var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
    function parse(src) {
      const obj = {};
      let lines = src.toString();
      lines = lines.replace(/\r\n?/mg, "\n");
      let match;
      while ((match = LINE.exec(lines)) != null) {
        const key = match[1];
        let value = match[2] || "";
        value = value.trim();
        const maybeQuote = value[0];
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
        if (maybeQuote === '"') {
          value = value.replace(/\\n/g, "\n");
          value = value.replace(/\\r/g, "\r");
        }
        obj[key] = value;
      }
      return obj;
    }
    function _parseVault(options) {
      options = options || {};
      const vaultPath = _vaultPath(options);
      options.path = vaultPath;
      const result = DotenvModule.configDotenv(options);
      if (!result.parsed) {
        const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
        err.code = "MISSING_DATA";
        throw err;
      }
      const keys = _dotenvKey(options).split(",");
      const length = keys.length;
      let decrypted;
      for (let i = 0; i < length; i++) {
        try {
          const key = keys[i].trim();
          const attrs = _instructions(result, key);
          decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
          break;
        } catch (error) {
          if (i + 1 >= length) {
            throw error;
          }
        }
      }
      return DotenvModule.parse(decrypted);
    }
    function _warn(message) {
      console.log(`[dotenv@${version2}][WARN] ${message}`);
    }
    function _debug(message) {
      console.log(`[dotenv@${version2}][DEBUG] ${message}`);
    }
    function _log(message) {
      console.log(`[dotenv@${version2}] ${message}`);
    }
    function _dotenvKey(options) {
      if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
        return options.DOTENV_KEY;
      }
      if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
        return process.env.DOTENV_KEY;
      }
      return "";
    }
    function _instructions(result, dotenvKey) {
      let uri;
      try {
        uri = new URL(dotenvKey);
      } catch (error) {
        if (error.code === "ERR_INVALID_URL") {
          const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        }
        throw error;
      }
      const key = uri.password;
      if (!key) {
        const err = new Error("INVALID_DOTENV_KEY: Missing key part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environment = uri.searchParams.get("environment");
      if (!environment) {
        const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
      const ciphertext = result.parsed[environmentKey];
      if (!ciphertext) {
        const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
        err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
        throw err;
      }
      return { ciphertext, key };
    }
    function _vaultPath(options) {
      let possibleVaultPath = null;
      if (options && options.path && options.path.length > 0) {
        if (Array.isArray(options.path)) {
          for (const filepath of options.path) {
            if (fs.existsSync(filepath)) {
              possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
            }
          }
        } else {
          possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
        }
      } else {
        possibleVaultPath = path2.resolve(process.cwd(), ".env.vault");
      }
      if (fs.existsSync(possibleVaultPath)) {
        return possibleVaultPath;
      }
      return null;
    }
    function _resolveHome(envPath) {
      return envPath[0] === "~" ? path2.join(os.homedir(), envPath.slice(1)) : envPath;
    }
    function _configVault(options) {
      const debug = Boolean(options && options.debug);
      const quiet = options && "quiet" in options ? options.quiet : true;
      if (debug || !quiet) {
        _log("Loading env from encrypted .env.vault");
      }
      const parsed = DotenvModule._parseVault(options);
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsed, options);
      return { parsed };
    }
    function configDotenv(options) {
      const dotenvPath = path2.resolve(process.cwd(), ".env");
      let encoding = "utf8";
      const debug = Boolean(options && options.debug);
      const quiet = options && "quiet" in options ? options.quiet : true;
      if (options && options.encoding) {
        encoding = options.encoding;
      } else {
        if (debug) {
          _debug("No encoding is specified. UTF-8 is used by default");
        }
      }
      let optionPaths = [dotenvPath];
      if (options && options.path) {
        if (!Array.isArray(options.path)) {
          optionPaths = [_resolveHome(options.path)];
        } else {
          optionPaths = [];
          for (const filepath of options.path) {
            optionPaths.push(_resolveHome(filepath));
          }
        }
      }
      let lastError;
      const parsedAll = {};
      for (const path3 of optionPaths) {
        try {
          const parsed = DotenvModule.parse(fs.readFileSync(path3, { encoding }));
          DotenvModule.populate(parsedAll, parsed, options);
        } catch (e) {
          if (debug) {
            _debug(`Failed to load ${path3} ${e.message}`);
          }
          lastError = e;
        }
      }
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsedAll, options);
      if (debug || !quiet) {
        const keysCount = Object.keys(parsedAll).length;
        const shortPaths = [];
        for (const filePath of optionPaths) {
          try {
            const relative = path2.relative(process.cwd(), filePath);
            shortPaths.push(relative);
          } catch (e) {
            if (debug) {
              _debug(`Failed to load ${filePath} ${e.message}`);
            }
            lastError = e;
          }
        }
        _log(`injecting env (${keysCount}) from ${shortPaths.join(",")}`);
      }
      if (lastError) {
        return { parsed: parsedAll, error: lastError };
      } else {
        return { parsed: parsedAll };
      }
    }
    function config(options) {
      if (_dotenvKey(options).length === 0) {
        return DotenvModule.configDotenv(options);
      }
      const vaultPath = _vaultPath(options);
      if (!vaultPath) {
        _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
        return DotenvModule.configDotenv(options);
      }
      return DotenvModule._configVault(options);
    }
    function decrypt(encrypted, keyStr) {
      const key = Buffer.from(keyStr.slice(-64), "hex");
      let ciphertext = Buffer.from(encrypted, "base64");
      const nonce = ciphertext.subarray(0, 12);
      const authTag = ciphertext.subarray(-16);
      ciphertext = ciphertext.subarray(12, -16);
      try {
        const aesgcm = crypto2.createDecipheriv("aes-256-gcm", key, nonce);
        aesgcm.setAuthTag(authTag);
        return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
      } catch (error) {
        const isRange = error instanceof RangeError;
        const invalidKeyLength = error.message === "Invalid key length";
        const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
        if (isRange || invalidKeyLength) {
          const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        } else if (decryptionFailed) {
          const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
          err.code = "DECRYPTION_FAILED";
          throw err;
        } else {
          throw error;
        }
      }
    }
    function populate(processEnv, parsed, options = {}) {
      const debug = Boolean(options && options.debug);
      const override = Boolean(options && options.override);
      if (typeof parsed !== "object") {
        const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
        err.code = "OBJECT_REQUIRED";
        throw err;
      }
      for (const key of Object.keys(parsed)) {
        if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
          if (override === true) {
            processEnv[key] = parsed[key];
          }
          if (debug) {
            if (override === true) {
              _debug(`"${key}" is already defined and WAS overwritten`);
            } else {
              _debug(`"${key}" is already defined and was NOT overwritten`);
            }
          }
        } else {
          processEnv[key] = parsed[key];
        }
      }
    }
    var DotenvModule = {
      configDotenv,
      _configVault,
      _parseVault,
      config,
      decrypt,
      parse,
      populate
    };
    module.exports.configDotenv = DotenvModule.configDotenv;
    module.exports._configVault = DotenvModule._configVault;
    module.exports._parseVault = DotenvModule._parseVault;
    module.exports.config = DotenvModule.config;
    module.exports.decrypt = DotenvModule.decrypt;
    module.exports.parse = DotenvModule.parse;
    module.exports.populate = DotenvModule.populate;
    module.exports = DotenvModule;
  }
});

// node_modules/dotenv/lib/env-options.js
var require_env_options = __commonJS({
  "node_modules/dotenv/lib/env-options.js"(exports, module) {
    var options = {};
    if (process.env.DOTENV_CONFIG_ENCODING != null) {
      options.encoding = process.env.DOTENV_CONFIG_ENCODING;
    }
    if (process.env.DOTENV_CONFIG_PATH != null) {
      options.path = process.env.DOTENV_CONFIG_PATH;
    }
    if (process.env.DOTENV_CONFIG_QUIET != null) {
      options.quiet = process.env.DOTENV_CONFIG_QUIET;
    }
    if (process.env.DOTENV_CONFIG_DEBUG != null) {
      options.debug = process.env.DOTENV_CONFIG_DEBUG;
    }
    if (process.env.DOTENV_CONFIG_OVERRIDE != null) {
      options.override = process.env.DOTENV_CONFIG_OVERRIDE;
    }
    if (process.env.DOTENV_CONFIG_DOTENV_KEY != null) {
      options.DOTENV_KEY = process.env.DOTENV_CONFIG_DOTENV_KEY;
    }
    module.exports = options;
  }
});

// node_modules/dotenv/lib/cli-options.js
var require_cli_options = __commonJS({
  "node_modules/dotenv/lib/cli-options.js"(exports, module) {
    var re = /^dotenv_config_(encoding|path|quiet|debug|override|DOTENV_KEY)=(.+)$/;
    module.exports = function optionMatcher(args) {
      const options = args.reduce(function(acc, cur) {
        const matches = cur.match(re);
        if (matches) {
          acc[matches[1]] = matches[2];
        }
        return acc;
      }, {});
      if (!("quiet" in options)) {
        options.quiet = "true";
      }
      return options;
    };
  }
});

// node_modules/pg/node_modules/postgres-array/index.js
var require_postgres_array = __commonJS({
  "node_modules/pg/node_modules/postgres-array/index.js"(exports) {
    "use strict";
    exports.parse = function(source, transform) {
      return new ArrayParser(source, transform).parse();
    };
    var ArrayParser = class _ArrayParser {
      constructor(source, transform) {
        this.source = source;
        this.transform = transform || identity;
        this.position = 0;
        this.entries = [];
        this.recorded = [];
        this.dimension = 0;
      }
      isEof() {
        return this.position >= this.source.length;
      }
      nextCharacter() {
        var character = this.source[this.position++];
        if (character === "\\") {
          return {
            value: this.source[this.position++],
            escaped: true
          };
        }
        return {
          value: character,
          escaped: false
        };
      }
      record(character) {
        this.recorded.push(character);
      }
      newEntry(includeEmpty) {
        var entry;
        if (this.recorded.length > 0 || includeEmpty) {
          entry = this.recorded.join("");
          if (entry === "NULL" && !includeEmpty) {
            entry = null;
          }
          if (entry !== null) entry = this.transform(entry);
          this.entries.push(entry);
          this.recorded = [];
        }
      }
      consumeDimensions() {
        if (this.source[0] === "[") {
          while (!this.isEof()) {
            var char2 = this.nextCharacter();
            if (char2.value === "=") break;
          }
        }
      }
      parse(nested) {
        var character, parser, quote;
        this.consumeDimensions();
        while (!this.isEof()) {
          character = this.nextCharacter();
          if (character.value === "{" && !quote) {
            this.dimension++;
            if (this.dimension > 1) {
              parser = new _ArrayParser(this.source.substr(this.position - 1), this.transform);
              this.entries.push(parser.parse(true));
              this.position += parser.position - 2;
            }
          } else if (character.value === "}" && !quote) {
            this.dimension--;
            if (!this.dimension) {
              this.newEntry();
              if (nested) return this.entries;
            }
          } else if (character.value === '"' && !character.escaped) {
            if (quote) this.newEntry(true);
            quote = !quote;
          } else if (character.value === "," && !quote) {
            this.newEntry();
          } else {
            this.record(character.value);
          }
        }
        if (this.dimension !== 0) {
          throw new Error("array dimension not balanced");
        }
        return this.entries;
      }
    };
    function identity(value) {
      return value;
    }
  }
});

// node_modules/pg/node_modules/pg-types/lib/arrayParser.js
var require_arrayParser = __commonJS({
  "node_modules/pg/node_modules/pg-types/lib/arrayParser.js"(exports, module) {
    var array = require_postgres_array();
    module.exports = {
      create: function(source, transform) {
        return {
          parse: function() {
            return array.parse(source, transform);
          }
        };
      }
    };
  }
});

// node_modules/pg/node_modules/postgres-date/index.js
var require_postgres_date = __commonJS({
  "node_modules/pg/node_modules/postgres-date/index.js"(exports, module) {
    "use strict";
    var DATE_TIME = /(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?.*?( BC)?$/;
    var DATE = /^(\d{1,})-(\d{2})-(\d{2})( BC)?$/;
    var TIME_ZONE = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/;
    var INFINITY2 = /^-?infinity$/;
    module.exports = function parseDate(isoDate) {
      if (INFINITY2.test(isoDate)) {
        return Number(isoDate.replace("i", "I"));
      }
      var matches = DATE_TIME.exec(isoDate);
      if (!matches) {
        return getDate(isoDate) || null;
      }
      var isBC = !!matches[8];
      var year = parseInt(matches[1], 10);
      if (isBC) {
        year = bcYearToNegativeYear(year);
      }
      var month = parseInt(matches[2], 10) - 1;
      var day = matches[3];
      var hour = parseInt(matches[4], 10);
      var minute = parseInt(matches[5], 10);
      var second = parseInt(matches[6], 10);
      var ms = matches[7];
      ms = ms ? 1e3 * parseFloat(ms) : 0;
      var date2;
      var offset = timeZoneOffset(isoDate);
      if (offset != null) {
        date2 = new Date(Date.UTC(year, month, day, hour, minute, second, ms));
        if (is0To99(year)) {
          date2.setUTCFullYear(year);
        }
        if (offset !== 0) {
          date2.setTime(date2.getTime() - offset);
        }
      } else {
        date2 = new Date(year, month, day, hour, minute, second, ms);
        if (is0To99(year)) {
          date2.setFullYear(year);
        }
      }
      return date2;
    };
    function getDate(isoDate) {
      var matches = DATE.exec(isoDate);
      if (!matches) {
        return;
      }
      var year = parseInt(matches[1], 10);
      var isBC = !!matches[4];
      if (isBC) {
        year = bcYearToNegativeYear(year);
      }
      var month = parseInt(matches[2], 10) - 1;
      var day = matches[3];
      var date2 = new Date(year, month, day);
      if (is0To99(year)) {
        date2.setFullYear(year);
      }
      return date2;
    }
    function timeZoneOffset(isoDate) {
      if (isoDate.endsWith("+00")) {
        return 0;
      }
      var zone = TIME_ZONE.exec(isoDate.split(" ")[1]);
      if (!zone) return;
      var type = zone[1];
      if (type === "Z") {
        return 0;
      }
      var sign = type === "-" ? -1 : 1;
      var offset = parseInt(zone[2], 10) * 3600 + parseInt(zone[3] || 0, 10) * 60 + parseInt(zone[4] || 0, 10);
      return offset * sign * 1e3;
    }
    function bcYearToNegativeYear(year) {
      return -(year - 1);
    }
    function is0To99(num) {
      return num >= 0 && num < 100;
    }
  }
});

// node_modules/xtend/mutable.js
var require_mutable = __commonJS({
  "node_modules/xtend/mutable.js"(exports, module) {
    module.exports = extend;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    function extend(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
          if (hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    }
  }
});

// node_modules/pg/node_modules/postgres-interval/index.js
var require_postgres_interval = __commonJS({
  "node_modules/pg/node_modules/postgres-interval/index.js"(exports, module) {
    "use strict";
    var extend = require_mutable();
    module.exports = PostgresInterval;
    function PostgresInterval(raw) {
      if (!(this instanceof PostgresInterval)) {
        return new PostgresInterval(raw);
      }
      extend(this, parse(raw));
    }
    var properties = ["seconds", "minutes", "hours", "days", "months", "years"];
    PostgresInterval.prototype.toPostgres = function() {
      var filtered = properties.filter(this.hasOwnProperty, this);
      if (this.milliseconds && filtered.indexOf("seconds") < 0) {
        filtered.push("seconds");
      }
      if (filtered.length === 0) return "0";
      return filtered.map(function(property) {
        var value = this[property] || 0;
        if (property === "seconds" && this.milliseconds) {
          value = (value + this.milliseconds / 1e3).toFixed(6).replace(/\.?0+$/, "");
        }
        return value + " " + property;
      }, this).join(" ");
    };
    var propertiesISOEquivalent = {
      years: "Y",
      months: "M",
      days: "D",
      hours: "H",
      minutes: "M",
      seconds: "S"
    };
    var dateProperties = ["years", "months", "days"];
    var timeProperties = ["hours", "minutes", "seconds"];
    PostgresInterval.prototype.toISOString = PostgresInterval.prototype.toISO = function() {
      var datePart = dateProperties.map(buildProperty, this).join("");
      var timePart = timeProperties.map(buildProperty, this).join("");
      return "P" + datePart + "T" + timePart;
      function buildProperty(property) {
        var value = this[property] || 0;
        if (property === "seconds" && this.milliseconds) {
          value = (value + this.milliseconds / 1e3).toFixed(6).replace(/0+$/, "");
        }
        return value + propertiesISOEquivalent[property];
      }
    };
    var NUMBER = "([+-]?\\d+)";
    var YEAR = NUMBER + "\\s+years?";
    var MONTH = NUMBER + "\\s+mons?";
    var DAY = NUMBER + "\\s+days?";
    var TIME = "([+-])?([\\d]*):(\\d\\d):(\\d\\d)\\.?(\\d{1,6})?";
    var INTERVAL = new RegExp([YEAR, MONTH, DAY, TIME].map(function(regexString) {
      return "(" + regexString + ")?";
    }).join("\\s*"));
    var positions = {
      years: 2,
      months: 4,
      days: 6,
      hours: 9,
      minutes: 10,
      seconds: 11,
      milliseconds: 12
    };
    var negatives = ["hours", "minutes", "seconds", "milliseconds"];
    function parseMilliseconds(fraction) {
      var microseconds = fraction + "000000".slice(fraction.length);
      return parseInt(microseconds, 10) / 1e3;
    }
    function parse(interval2) {
      if (!interval2) return {};
      var matches = INTERVAL.exec(interval2);
      var isNegative = matches[8] === "-";
      return Object.keys(positions).reduce(function(parsed, property) {
        var position = positions[property];
        var value = matches[position];
        if (!value) return parsed;
        value = property === "milliseconds" ? parseMilliseconds(value) : parseInt(value, 10);
        if (!value) return parsed;
        if (isNegative && ~negatives.indexOf(property)) {
          value *= -1;
        }
        parsed[property] = value;
        return parsed;
      }, {});
    }
  }
});

// node_modules/pg/node_modules/postgres-bytea/index.js
var require_postgres_bytea = __commonJS({
  "node_modules/pg/node_modules/postgres-bytea/index.js"(exports, module) {
    "use strict";
    module.exports = function parseBytea(input) {
      if (/^\\x/.test(input)) {
        return new Buffer(input.substr(2), "hex");
      }
      var output = "";
      var i = 0;
      while (i < input.length) {
        if (input[i] !== "\\") {
          output += input[i];
          ++i;
        } else {
          if (/[0-7]{3}/.test(input.substr(i + 1, 3))) {
            output += String.fromCharCode(parseInt(input.substr(i + 1, 3), 8));
            i += 4;
          } else {
            var backslashes = 1;
            while (i + backslashes < input.length && input[i + backslashes] === "\\") {
              backslashes++;
            }
            for (var k = 0; k < Math.floor(backslashes / 2); ++k) {
              output += "\\";
            }
            i += Math.floor(backslashes / 2) * 2;
          }
        }
      }
      return new Buffer(output, "binary");
    };
  }
});

// node_modules/pg/node_modules/pg-types/lib/textParsers.js
var require_textParsers = __commonJS({
  "node_modules/pg/node_modules/pg-types/lib/textParsers.js"(exports, module) {
    var array = require_postgres_array();
    var arrayParser = require_arrayParser();
    var parseDate = require_postgres_date();
    var parseInterval = require_postgres_interval();
    var parseByteA = require_postgres_bytea();
    function allowNull(fn) {
      return function nullAllowed(value) {
        if (value === null) return value;
        return fn(value);
      };
    }
    function parseBool(value) {
      if (value === null) return value;
      return value === "TRUE" || value === "t" || value === "true" || value === "y" || value === "yes" || value === "on" || value === "1";
    }
    function parseBoolArray(value) {
      if (!value) return null;
      return array.parse(value, parseBool);
    }
    function parseBaseTenInt(string) {
      return parseInt(string, 10);
    }
    function parseIntegerArray(value) {
      if (!value) return null;
      return array.parse(value, allowNull(parseBaseTenInt));
    }
    function parseBigIntegerArray(value) {
      if (!value) return null;
      return array.parse(value, allowNull(function(entry) {
        return parseBigInteger(entry).trim();
      }));
    }
    var parsePointArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parsePoint(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseFloatArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseFloat(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseStringArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value);
      return p.parse();
    };
    var parseDateArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseDate(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseIntervalArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseInterval(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseByteAArray = function(value) {
      if (!value) {
        return null;
      }
      return array.parse(value, allowNull(parseByteA));
    };
    var parseInteger = function(value) {
      return parseInt(value, 10);
    };
    var parseBigInteger = function(value) {
      var valStr = String(value);
      if (/^\d+$/.test(valStr)) {
        return valStr;
      }
      return value;
    };
    var parseJsonArray = function(value) {
      if (!value) {
        return null;
      }
      return array.parse(value, allowNull(JSON.parse));
    };
    var parsePoint = function(value) {
      if (value[0] !== "(") {
        return null;
      }
      value = value.substring(1, value.length - 1).split(",");
      return {
        x: parseFloat(value[0]),
        y: parseFloat(value[1])
      };
    };
    var parseCircle = function(value) {
      if (value[0] !== "<" && value[1] !== "(") {
        return null;
      }
      var point2 = "(";
      var radius = "";
      var pointParsed = false;
      for (var i = 2; i < value.length - 1; i++) {
        if (!pointParsed) {
          point2 += value[i];
        }
        if (value[i] === ")") {
          pointParsed = true;
          continue;
        } else if (!pointParsed) {
          continue;
        }
        if (value[i] === ",") {
          continue;
        }
        radius += value[i];
      }
      var result = parsePoint(point2);
      result.radius = parseFloat(radius);
      return result;
    };
    var init = function(register) {
      register(20, parseBigInteger);
      register(21, parseInteger);
      register(23, parseInteger);
      register(26, parseInteger);
      register(700, parseFloat);
      register(701, parseFloat);
      register(16, parseBool);
      register(1082, parseDate);
      register(1114, parseDate);
      register(1184, parseDate);
      register(600, parsePoint);
      register(651, parseStringArray);
      register(718, parseCircle);
      register(1e3, parseBoolArray);
      register(1001, parseByteAArray);
      register(1005, parseIntegerArray);
      register(1007, parseIntegerArray);
      register(1028, parseIntegerArray);
      register(1016, parseBigIntegerArray);
      register(1017, parsePointArray);
      register(1021, parseFloatArray);
      register(1022, parseFloatArray);
      register(1231, parseFloatArray);
      register(1014, parseStringArray);
      register(1015, parseStringArray);
      register(1008, parseStringArray);
      register(1009, parseStringArray);
      register(1040, parseStringArray);
      register(1041, parseStringArray);
      register(1115, parseDateArray);
      register(1182, parseDateArray);
      register(1185, parseDateArray);
      register(1186, parseInterval);
      register(1187, parseIntervalArray);
      register(17, parseByteA);
      register(114, JSON.parse.bind(JSON));
      register(3802, JSON.parse.bind(JSON));
      register(199, parseJsonArray);
      register(3807, parseJsonArray);
      register(3907, parseStringArray);
      register(2951, parseStringArray);
      register(791, parseStringArray);
      register(1183, parseStringArray);
      register(1270, parseStringArray);
    };
    module.exports = {
      init
    };
  }
});

// node_modules/pg-int8/index.js
var require_pg_int8 = __commonJS({
  "node_modules/pg-int8/index.js"(exports, module) {
    "use strict";
    var BASE = 1e6;
    function readInt8(buffer) {
      var high = buffer.readInt32BE(0);
      var low = buffer.readUInt32BE(4);
      var sign = "";
      if (high < 0) {
        high = ~high + (low === 0);
        low = ~low + 1 >>> 0;
        sign = "-";
      }
      var result = "";
      var carry;
      var t;
      var digits;
      var pad;
      var l;
      var i;
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        t = 4294967296 * carry + low;
        digits = "" + t % BASE;
        return sign + digits + result;
      }
    }
    module.exports = readInt8;
  }
});

// node_modules/pg/node_modules/pg-types/lib/binaryParsers.js
var require_binaryParsers = __commonJS({
  "node_modules/pg/node_modules/pg-types/lib/binaryParsers.js"(exports, module) {
    var parseInt64 = require_pg_int8();
    var parseBits = function(data, bits, offset, invert, callback) {
      offset = offset || 0;
      invert = invert || false;
      callback = callback || function(lastValue, newValue, bits2) {
        return lastValue * Math.pow(2, bits2) + newValue;
      };
      var offsetBytes = offset >> 3;
      var inv = function(value) {
        if (invert) {
          return ~value & 255;
        }
        return value;
      };
      var mask = 255;
      var firstBits = 8 - offset % 8;
      if (bits < firstBits) {
        mask = 255 << 8 - bits & 255;
        firstBits = bits;
      }
      if (offset) {
        mask = mask >> offset % 8;
      }
      var result = 0;
      if (offset % 8 + bits >= 8) {
        result = callback(0, inv(data[offsetBytes]) & mask, firstBits);
      }
      var bytes = bits + offset >> 3;
      for (var i = offsetBytes + 1; i < bytes; i++) {
        result = callback(result, inv(data[i]), 8);
      }
      var lastBits = (bits + offset) % 8;
      if (lastBits > 0) {
        result = callback(result, inv(data[bytes]) >> 8 - lastBits, lastBits);
      }
      return result;
    };
    var parseFloatFromBits = function(data, precisionBits, exponentBits) {
      var bias = Math.pow(2, exponentBits - 1) - 1;
      var sign = parseBits(data, 1);
      var exponent = parseBits(data, exponentBits, 1);
      if (exponent === 0) {
        return 0;
      }
      var precisionBitsCounter = 1;
      var parsePrecisionBits = function(lastValue, newValue, bits) {
        if (lastValue === 0) {
          lastValue = 1;
        }
        for (var i = 1; i <= bits; i++) {
          precisionBitsCounter /= 2;
          if ((newValue & 1 << bits - i) > 0) {
            lastValue += precisionBitsCounter;
          }
        }
        return lastValue;
      };
      var mantissa = parseBits(data, precisionBits, exponentBits + 1, false, parsePrecisionBits);
      if (exponent == Math.pow(2, exponentBits + 1) - 1) {
        if (mantissa === 0) {
          return sign === 0 ? Infinity : -Infinity;
        }
        return NaN;
      }
      return (sign === 0 ? 1 : -1) * Math.pow(2, exponent - bias) * mantissa;
    };
    var parseInt16 = function(value) {
      if (parseBits(value, 1) == 1) {
        return -1 * (parseBits(value, 15, 1, true) + 1);
      }
      return parseBits(value, 15, 1);
    };
    var parseInt32 = function(value) {
      if (parseBits(value, 1) == 1) {
        return -1 * (parseBits(value, 31, 1, true) + 1);
      }
      return parseBits(value, 31, 1);
    };
    var parseFloat32 = function(value) {
      return parseFloatFromBits(value, 23, 8);
    };
    var parseFloat64 = function(value) {
      return parseFloatFromBits(value, 52, 11);
    };
    var parseNumeric = function(value) {
      var sign = parseBits(value, 16, 32);
      if (sign == 49152) {
        return NaN;
      }
      var weight = Math.pow(1e4, parseBits(value, 16, 16));
      var result = 0;
      var digits = [];
      var ndigits = parseBits(value, 16);
      for (var i = 0; i < ndigits; i++) {
        result += parseBits(value, 16, 64 + 16 * i) * weight;
        weight /= 1e4;
      }
      var scale = Math.pow(10, parseBits(value, 16, 48));
      return (sign === 0 ? 1 : -1) * Math.round(result * scale) / scale;
    };
    var parseDate = function(isUTC, value) {
      var sign = parseBits(value, 1);
      var rawValue = parseBits(value, 63, 1);
      var result = new Date((sign === 0 ? 1 : -1) * rawValue / 1e3 + 9466848e5);
      if (!isUTC) {
        result.setTime(result.getTime() + result.getTimezoneOffset() * 6e4);
      }
      result.usec = rawValue % 1e3;
      result.getMicroSeconds = function() {
        return this.usec;
      };
      result.setMicroSeconds = function(value2) {
        this.usec = value2;
      };
      result.getUTCMicroSeconds = function() {
        return this.usec;
      };
      return result;
    };
    var parseArray = function(value) {
      var dim = parseBits(value, 32);
      var flags = parseBits(value, 32, 32);
      var elementType = parseBits(value, 32, 64);
      var offset = 96;
      var dims = [];
      for (var i = 0; i < dim; i++) {
        dims[i] = parseBits(value, 32, offset);
        offset += 32;
        offset += 32;
      }
      var parseElement = function(elementType2) {
        var length = parseBits(value, 32, offset);
        offset += 32;
        if (length == 4294967295) {
          return null;
        }
        var result;
        if (elementType2 == 23 || elementType2 == 20) {
          result = parseBits(value, length * 8, offset);
          offset += length * 8;
          return result;
        } else if (elementType2 == 25) {
          result = value.toString(this.encoding, offset >> 3, (offset += length << 3) >> 3);
          return result;
        } else {
          console.log("ERROR: ElementType not implemented: " + elementType2);
        }
      };
      var parse = function(dimension, elementType2) {
        var array = [];
        var i2;
        if (dimension.length > 1) {
          var count = dimension.shift();
          for (i2 = 0; i2 < count; i2++) {
            array[i2] = parse(dimension, elementType2);
          }
          dimension.unshift(count);
        } else {
          for (i2 = 0; i2 < dimension[0]; i2++) {
            array[i2] = parseElement(elementType2);
          }
        }
        return array;
      };
      return parse(dims, elementType);
    };
    var parseText = function(value) {
      return value.toString("utf8");
    };
    var parseBool = function(value) {
      if (value === null) return null;
      return parseBits(value, 8) > 0;
    };
    var init = function(register) {
      register(20, parseInt64);
      register(21, parseInt16);
      register(23, parseInt32);
      register(26, parseInt32);
      register(1700, parseNumeric);
      register(700, parseFloat32);
      register(701, parseFloat64);
      register(16, parseBool);
      register(1114, parseDate.bind(null, false));
      register(1184, parseDate.bind(null, true));
      register(1e3, parseArray);
      register(1007, parseArray);
      register(1016, parseArray);
      register(1008, parseArray);
      register(1009, parseArray);
      register(25, parseText);
    };
    module.exports = {
      init
    };
  }
});

// node_modules/pg/node_modules/pg-types/lib/builtins.js
var require_builtins = __commonJS({
  "node_modules/pg/node_modules/pg-types/lib/builtins.js"(exports, module) {
    module.exports = {
      BOOL: 16,
      BYTEA: 17,
      CHAR: 18,
      INT8: 20,
      INT2: 21,
      INT4: 23,
      REGPROC: 24,
      TEXT: 25,
      OID: 26,
      TID: 27,
      XID: 28,
      CID: 29,
      JSON: 114,
      XML: 142,
      PG_NODE_TREE: 194,
      SMGR: 210,
      PATH: 602,
      POLYGON: 604,
      CIDR: 650,
      FLOAT4: 700,
      FLOAT8: 701,
      ABSTIME: 702,
      RELTIME: 703,
      TINTERVAL: 704,
      CIRCLE: 718,
      MACADDR8: 774,
      MONEY: 790,
      MACADDR: 829,
      INET: 869,
      ACLITEM: 1033,
      BPCHAR: 1042,
      VARCHAR: 1043,
      DATE: 1082,
      TIME: 1083,
      TIMESTAMP: 1114,
      TIMESTAMPTZ: 1184,
      INTERVAL: 1186,
      TIMETZ: 1266,
      BIT: 1560,
      VARBIT: 1562,
      NUMERIC: 1700,
      REFCURSOR: 1790,
      REGPROCEDURE: 2202,
      REGOPER: 2203,
      REGOPERATOR: 2204,
      REGCLASS: 2205,
      REGTYPE: 2206,
      UUID: 2950,
      TXID_SNAPSHOT: 2970,
      PG_LSN: 3220,
      PG_NDISTINCT: 3361,
      PG_DEPENDENCIES: 3402,
      TSVECTOR: 3614,
      TSQUERY: 3615,
      GTSVECTOR: 3642,
      REGCONFIG: 3734,
      REGDICTIONARY: 3769,
      JSONB: 3802,
      REGNAMESPACE: 4089,
      REGROLE: 4096
    };
  }
});

// node_modules/pg/node_modules/pg-types/index.js
var require_pg_types = __commonJS({
  "node_modules/pg/node_modules/pg-types/index.js"(exports) {
    var textParsers = require_textParsers();
    var binaryParsers = require_binaryParsers();
    var arrayParser = require_arrayParser();
    var builtinTypes = require_builtins();
    exports.getTypeParser = getTypeParser;
    exports.setTypeParser = setTypeParser;
    exports.arrayParser = arrayParser;
    exports.builtins = builtinTypes;
    var typeParsers = {
      text: {},
      binary: {}
    };
    function noParse(val) {
      return String(val);
    }
    function getTypeParser(oid, format) {
      format = format || "text";
      if (!typeParsers[format]) {
        return noParse;
      }
      return typeParsers[format][oid] || noParse;
    }
    function setTypeParser(oid, format, parseFn) {
      if (typeof format == "function") {
        parseFn = format;
        format = "text";
      }
      typeParsers[format][oid] = parseFn;
    }
    textParsers.init(function(oid, converter) {
      typeParsers.text[oid] = converter;
    });
    binaryParsers.init(function(oid, converter) {
      typeParsers.binary[oid] = converter;
    });
  }
});

// node_modules/pg/lib/defaults.js
var require_defaults = __commonJS({
  "node_modules/pg/lib/defaults.js"(exports, module) {
    "use strict";
    module.exports = {
      // database host. defaults to localhost
      host: "localhost",
      // database user's name
      user: process.platform === "win32" ? process.env.USERNAME : process.env.USER,
      // name of database to connect
      database: void 0,
      // database user's password
      password: null,
      // a Postgres connection string to be used instead of setting individual connection items
      // NOTE:  Setting this value will cause it to override any other value (such as database or user) defined
      // in the defaults object.
      connectionString: void 0,
      // database port
      port: 5432,
      // number of rows to return at a time from a prepared statement's
      // portal. 0 will return all rows at once
      rows: 0,
      // binary result mode
      binary: false,
      // Connection pool options - see https://github.com/brianc/node-pg-pool
      // number of connections to use in connection pool
      // 0 will disable connection pooling
      max: 10,
      // max milliseconds a client can go unused before it is removed
      // from the pool and destroyed
      idleTimeoutMillis: 3e4,
      client_encoding: "",
      ssl: false,
      application_name: void 0,
      fallback_application_name: void 0,
      options: void 0,
      parseInputDatesAsUTC: false,
      // max milliseconds any query using this connection will execute for before timing out in error.
      // false=unlimited
      statement_timeout: false,
      // Abort any statement that waits longer than the specified duration in milliseconds while attempting to acquire a lock.
      // false=unlimited
      lock_timeout: false,
      // Terminate any session with an open transaction that has been idle for longer than the specified duration in milliseconds
      // false=unlimited
      idle_in_transaction_session_timeout: false,
      // max milliseconds to wait for query to complete (client side)
      query_timeout: false,
      connect_timeout: 0,
      keepalives: 1,
      keepalives_idle: 0
    };
    var pgTypes = require_pg_types();
    var parseBigInteger = pgTypes.getTypeParser(20, "text");
    var parseBigIntegerArray = pgTypes.getTypeParser(1016, "text");
    module.exports.__defineSetter__("parseInt8", function(val) {
      pgTypes.setTypeParser(20, "text", val ? pgTypes.getTypeParser(23, "text") : parseBigInteger);
      pgTypes.setTypeParser(1016, "text", val ? pgTypes.getTypeParser(1007, "text") : parseBigIntegerArray);
    });
  }
});

// node_modules/pg/lib/utils.js
var require_utils = __commonJS({
  "node_modules/pg/lib/utils.js"(exports, module) {
    "use strict";
    var defaults3 = require_defaults();
    var util2 = __require("util");
    var { isDate } = util2.types || util2;
    function escapeElement(elementRepresentation) {
      const escaped = elementRepresentation.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return '"' + escaped + '"';
    }
    function arrayString(val) {
      let result = "{";
      for (let i = 0; i < val.length; i++) {
        if (i > 0) {
          result = result + ",";
        }
        if (val[i] === null || typeof val[i] === "undefined") {
          result = result + "NULL";
        } else if (Array.isArray(val[i])) {
          result = result + arrayString(val[i]);
        } else if (ArrayBuffer.isView(val[i])) {
          let item = val[i];
          if (!(item instanceof Buffer)) {
            const buf = Buffer.from(item.buffer, item.byteOffset, item.byteLength);
            if (buf.length === item.byteLength) {
              item = buf;
            } else {
              item = buf.slice(item.byteOffset, item.byteOffset + item.byteLength);
            }
          }
          result += "\\\\x" + item.toString("hex");
        } else {
          result += escapeElement(prepareValue(val[i]));
        }
      }
      result = result + "}";
      return result;
    }
    var prepareValue = function(val, seen) {
      if (val == null) {
        return null;
      }
      if (typeof val === "object") {
        if (val instanceof Buffer) {
          return val;
        }
        if (ArrayBuffer.isView(val)) {
          const buf = Buffer.from(val.buffer, val.byteOffset, val.byteLength);
          if (buf.length === val.byteLength) {
            return buf;
          }
          return buf.slice(val.byteOffset, val.byteOffset + val.byteLength);
        }
        if (isDate(val)) {
          if (defaults3.parseInputDatesAsUTC) {
            return dateToStringUTC(val);
          } else {
            return dateToString(val);
          }
        }
        if (Array.isArray(val)) {
          return arrayString(val);
        }
        return prepareObject(val, seen);
      }
      return val.toString();
    };
    function prepareObject(val, seen) {
      if (val && typeof val.toPostgres === "function") {
        seen = seen || [];
        if (seen.indexOf(val) !== -1) {
          throw new Error('circular reference detected while preparing "' + val + '" for query');
        }
        seen.push(val);
        return prepareValue(val.toPostgres(prepareValue), seen);
      }
      return JSON.stringify(val);
    }
    function dateToString(date2) {
      let offset = -date2.getTimezoneOffset();
      let year = date2.getFullYear();
      const isBCYear = year < 1;
      if (isBCYear) year = Math.abs(year) + 1;
      let ret = String(year).padStart(4, "0") + "-" + String(date2.getMonth() + 1).padStart(2, "0") + "-" + String(date2.getDate()).padStart(2, "0") + "T" + String(date2.getHours()).padStart(2, "0") + ":" + String(date2.getMinutes()).padStart(2, "0") + ":" + String(date2.getSeconds()).padStart(2, "0") + "." + String(date2.getMilliseconds()).padStart(3, "0");
      if (offset < 0) {
        ret += "-";
        offset *= -1;
      } else {
        ret += "+";
      }
      ret += String(Math.floor(offset / 60)).padStart(2, "0") + ":" + String(offset % 60).padStart(2, "0");
      if (isBCYear) ret += " BC";
      return ret;
    }
    function dateToStringUTC(date2) {
      let year = date2.getUTCFullYear();
      const isBCYear = year < 1;
      if (isBCYear) year = Math.abs(year) + 1;
      let ret = String(year).padStart(4, "0") + "-" + String(date2.getUTCMonth() + 1).padStart(2, "0") + "-" + String(date2.getUTCDate()).padStart(2, "0") + "T" + String(date2.getUTCHours()).padStart(2, "0") + ":" + String(date2.getUTCMinutes()).padStart(2, "0") + ":" + String(date2.getUTCSeconds()).padStart(2, "0") + "." + String(date2.getUTCMilliseconds()).padStart(3, "0");
      ret += "+00:00";
      if (isBCYear) ret += " BC";
      return ret;
    }
    function normalizeQueryConfig(config, values, callback) {
      config = typeof config === "string" ? { text: config } : config;
      if (values) {
        if (typeof values === "function") {
          config.callback = values;
        } else {
          config.values = values;
        }
      }
      if (callback) {
        config.callback = callback;
      }
      return config;
    }
    var escapeIdentifier2 = function(str2) {
      return '"' + str2.replace(/"/g, '""') + '"';
    };
    var escapeLiteral2 = function(str2) {
      let hasBackslash = false;
      let escaped = "'";
      if (str2 == null) {
        return "''";
      }
      if (typeof str2 !== "string") {
        return "''";
      }
      for (let i = 0; i < str2.length; i++) {
        const c = str2[i];
        if (c === "'") {
          escaped += c + c;
        } else if (c === "\\") {
          escaped += c + c;
          hasBackslash = true;
        } else {
          escaped += c;
        }
      }
      escaped += "'";
      if (hasBackslash === true) {
        escaped = " E" + escaped;
      }
      return escaped;
    };
    module.exports = {
      prepareValue: function prepareValueWrapper(value) {
        return prepareValue(value);
      },
      normalizeQueryConfig,
      escapeIdentifier: escapeIdentifier2,
      escapeLiteral: escapeLiteral2
    };
  }
});

// node_modules/pg/lib/crypto/utils-legacy.js
var require_utils_legacy = __commonJS({
  "node_modules/pg/lib/crypto/utils-legacy.js"(exports, module) {
    "use strict";
    var nodeCrypto = __require("crypto");
    function md5(string) {
      return nodeCrypto.createHash("md5").update(string, "utf-8").digest("hex");
    }
    function postgresMd5PasswordHash(user, password, salt) {
      const inner = md5(password + user);
      const outer = md5(Buffer.concat([Buffer.from(inner), salt]));
      return "md5" + outer;
    }
    function sha256(text2) {
      return nodeCrypto.createHash("sha256").update(text2).digest();
    }
    function hashByName(hashName, text2) {
      hashName = hashName.replace(/(\D)-/, "$1");
      return nodeCrypto.createHash(hashName).update(text2).digest();
    }
    function hmacSha256(key, msg) {
      return nodeCrypto.createHmac("sha256", key).update(msg).digest();
    }
    async function deriveKey(password, salt, iterations) {
      return nodeCrypto.pbkdf2Sync(password, salt, iterations, 32, "sha256");
    }
    module.exports = {
      postgresMd5PasswordHash,
      randomBytes: nodeCrypto.randomBytes,
      deriveKey,
      sha256,
      hashByName,
      hmacSha256,
      md5
    };
  }
});

// node_modules/pg/lib/crypto/utils-webcrypto.js
var require_utils_webcrypto = __commonJS({
  "node_modules/pg/lib/crypto/utils-webcrypto.js"(exports, module) {
    var nodeCrypto = __require("crypto");
    module.exports = {
      postgresMd5PasswordHash,
      randomBytes,
      deriveKey,
      sha256,
      hashByName,
      hmacSha256,
      md5
    };
    var webCrypto = nodeCrypto.webcrypto || globalThis.crypto;
    var subtleCrypto = webCrypto.subtle;
    var textEncoder = new TextEncoder();
    function randomBytes(length) {
      return webCrypto.getRandomValues(Buffer.alloc(length));
    }
    async function md5(string) {
      try {
        return nodeCrypto.createHash("md5").update(string, "utf-8").digest("hex");
      } catch (e) {
        const data = typeof string === "string" ? textEncoder.encode(string) : string;
        const hash = await subtleCrypto.digest("MD5", data);
        return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
      }
    }
    async function postgresMd5PasswordHash(user, password, salt) {
      const inner = await md5(password + user);
      const outer = await md5(Buffer.concat([Buffer.from(inner), salt]));
      return "md5" + outer;
    }
    async function sha256(text2) {
      return await subtleCrypto.digest("SHA-256", text2);
    }
    async function hashByName(hashName, text2) {
      return await subtleCrypto.digest(hashName, text2);
    }
    async function hmacSha256(keyBuffer, msg) {
      const key = await subtleCrypto.importKey("raw", keyBuffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      return await subtleCrypto.sign("HMAC", key, textEncoder.encode(msg));
    }
    async function deriveKey(password, salt, iterations) {
      const key = await subtleCrypto.importKey("raw", textEncoder.encode(password), "PBKDF2", false, ["deriveBits"]);
      const params = { name: "PBKDF2", hash: "SHA-256", salt, iterations };
      return await subtleCrypto.deriveBits(params, key, 32 * 8, ["deriveBits"]);
    }
  }
});

// node_modules/pg/lib/crypto/utils.js
var require_utils2 = __commonJS({
  "node_modules/pg/lib/crypto/utils.js"(exports, module) {
    "use strict";
    var useLegacyCrypto = parseInt(process.versions && process.versions.node && process.versions.node.split(".")[0]) < 15;
    if (useLegacyCrypto) {
      module.exports = require_utils_legacy();
    } else {
      module.exports = require_utils_webcrypto();
    }
  }
});

// node_modules/pg/lib/crypto/cert-signatures.js
var require_cert_signatures = __commonJS({
  "node_modules/pg/lib/crypto/cert-signatures.js"(exports, module) {
    function x509Error(msg, cert) {
      return new Error("SASL channel binding: " + msg + " when parsing public certificate " + cert.toString("base64"));
    }
    function readASN1Length(data, index) {
      let length = data[index++];
      if (length < 128) return { length, index };
      const lengthBytes = length & 127;
      if (lengthBytes > 4) throw x509Error("bad length", data);
      length = 0;
      for (let i = 0; i < lengthBytes; i++) {
        length = length << 8 | data[index++];
      }
      return { length, index };
    }
    function readASN1OID(data, index) {
      if (data[index++] !== 6) throw x509Error("non-OID data", data);
      const { length: OIDLength, index: indexAfterOIDLength } = readASN1Length(data, index);
      index = indexAfterOIDLength;
      const lastIndex = index + OIDLength;
      const byte1 = data[index++];
      let oid = (byte1 / 40 >> 0) + "." + byte1 % 40;
      while (index < lastIndex) {
        let value = 0;
        while (index < lastIndex) {
          const nextByte = data[index++];
          value = value << 7 | nextByte & 127;
          if (nextByte < 128) break;
        }
        oid += "." + value;
      }
      return { oid, index };
    }
    function expectASN1Seq(data, index) {
      if (data[index++] !== 48) throw x509Error("non-sequence data", data);
      return readASN1Length(data, index);
    }
    function signatureAlgorithmHashFromCertificate(data, index) {
      if (index === void 0) index = 0;
      index = expectASN1Seq(data, index).index;
      const { length: certInfoLength, index: indexAfterCertInfoLength } = expectASN1Seq(data, index);
      index = indexAfterCertInfoLength + certInfoLength;
      index = expectASN1Seq(data, index).index;
      const { oid, index: indexAfterOID } = readASN1OID(data, index);
      switch (oid) {
        // RSA
        case "1.2.840.113549.1.1.4":
          return "MD5";
        case "1.2.840.113549.1.1.5":
          return "SHA-1";
        case "1.2.840.113549.1.1.11":
          return "SHA-256";
        case "1.2.840.113549.1.1.12":
          return "SHA-384";
        case "1.2.840.113549.1.1.13":
          return "SHA-512";
        case "1.2.840.113549.1.1.14":
          return "SHA-224";
        case "1.2.840.113549.1.1.15":
          return "SHA512-224";
        case "1.2.840.113549.1.1.16":
          return "SHA512-256";
        // ECDSA
        case "1.2.840.10045.4.1":
          return "SHA-1";
        case "1.2.840.10045.4.3.1":
          return "SHA-224";
        case "1.2.840.10045.4.3.2":
          return "SHA-256";
        case "1.2.840.10045.4.3.3":
          return "SHA-384";
        case "1.2.840.10045.4.3.4":
          return "SHA-512";
        // RSASSA-PSS: hash is indicated separately
        case "1.2.840.113549.1.1.10": {
          index = indexAfterOID;
          index = expectASN1Seq(data, index).index;
          if (data[index++] !== 160) throw x509Error("non-tag data", data);
          index = readASN1Length(data, index).index;
          index = expectASN1Seq(data, index).index;
          const { oid: hashOID } = readASN1OID(data, index);
          switch (hashOID) {
            // standalone hash OIDs
            case "1.2.840.113549.2.5":
              return "MD5";
            case "1.3.14.3.2.26":
              return "SHA-1";
            case "2.16.840.1.101.3.4.2.1":
              return "SHA-256";
            case "2.16.840.1.101.3.4.2.2":
              return "SHA-384";
            case "2.16.840.1.101.3.4.2.3":
              return "SHA-512";
          }
          throw x509Error("unknown hash OID " + hashOID, data);
        }
        // Ed25519 -- see https: return//github.com/openssl/openssl/issues/15477
        case "1.3.101.110":
        case "1.3.101.112":
          return "SHA-512";
        // Ed448 -- still not in pg 17.2 (if supported, digest would be SHAKE256 x 64 bytes)
        case "1.3.101.111":
        case "1.3.101.113":
          throw x509Error("Ed448 certificate channel binding is not currently supported by Postgres");
      }
      throw x509Error("unknown OID " + oid, data);
    }
    module.exports = { signatureAlgorithmHashFromCertificate };
  }
});

// node_modules/pg/lib/crypto/sasl.js
var require_sasl = __commonJS({
  "node_modules/pg/lib/crypto/sasl.js"(exports, module) {
    "use strict";
    var crypto2 = require_utils2();
    var { signatureAlgorithmHashFromCertificate } = require_cert_signatures();
    function startSession(mechanisms, stream) {
      const candidates = ["SCRAM-SHA-256"];
      if (stream) candidates.unshift("SCRAM-SHA-256-PLUS");
      const mechanism = candidates.find((candidate) => mechanisms.includes(candidate));
      if (!mechanism) {
        throw new Error("SASL: Only mechanism(s) " + candidates.join(" and ") + " are supported");
      }
      if (mechanism === "SCRAM-SHA-256-PLUS" && typeof stream.getPeerCertificate !== "function") {
        throw new Error("SASL: Mechanism SCRAM-SHA-256-PLUS requires a certificate");
      }
      const clientNonce = crypto2.randomBytes(18).toString("base64");
      const gs2Header = mechanism === "SCRAM-SHA-256-PLUS" ? "p=tls-server-end-point" : stream ? "y" : "n";
      return {
        mechanism,
        clientNonce,
        response: gs2Header + ",,n=*,r=" + clientNonce,
        message: "SASLInitialResponse"
      };
    }
    async function continueSession(session, password, serverData, stream) {
      if (session.message !== "SASLInitialResponse") {
        throw new Error("SASL: Last message was not SASLInitialResponse");
      }
      if (typeof password !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string");
      }
      if (password === "") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a non-empty string");
      }
      if (typeof serverData !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: serverData must be a string");
      }
      const sv = parseServerFirstMessage(serverData);
      if (!sv.nonce.startsWith(session.clientNonce)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce");
      } else if (sv.nonce.length === session.clientNonce.length) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
      }
      const clientFirstMessageBare = "n=*,r=" + session.clientNonce;
      const serverFirstMessage = "r=" + sv.nonce + ",s=" + sv.salt + ",i=" + sv.iteration;
      let channelBinding = stream ? "eSws" : "biws";
      if (session.mechanism === "SCRAM-SHA-256-PLUS") {
        const peerCert = stream.getPeerCertificate().raw;
        let hashName = signatureAlgorithmHashFromCertificate(peerCert);
        if (hashName === "MD5" || hashName === "SHA-1") hashName = "SHA-256";
        const certHash = await crypto2.hashByName(hashName, peerCert);
        const bindingData = Buffer.concat([Buffer.from("p=tls-server-end-point,,"), Buffer.from(certHash)]);
        channelBinding = bindingData.toString("base64");
      }
      const clientFinalMessageWithoutProof = "c=" + channelBinding + ",r=" + sv.nonce;
      const authMessage = clientFirstMessageBare + "," + serverFirstMessage + "," + clientFinalMessageWithoutProof;
      const saltBytes = Buffer.from(sv.salt, "base64");
      const saltedPassword = await crypto2.deriveKey(password, saltBytes, sv.iteration);
      const clientKey = await crypto2.hmacSha256(saltedPassword, "Client Key");
      const storedKey = await crypto2.sha256(clientKey);
      const clientSignature = await crypto2.hmacSha256(storedKey, authMessage);
      const clientProof = xorBuffers(Buffer.from(clientKey), Buffer.from(clientSignature)).toString("base64");
      const serverKey = await crypto2.hmacSha256(saltedPassword, "Server Key");
      const serverSignatureBytes = await crypto2.hmacSha256(serverKey, authMessage);
      session.message = "SASLResponse";
      session.serverSignature = Buffer.from(serverSignatureBytes).toString("base64");
      session.response = clientFinalMessageWithoutProof + ",p=" + clientProof;
    }
    function finalizeSession(session, serverData) {
      if (session.message !== "SASLResponse") {
        throw new Error("SASL: Last message was not SASLResponse");
      }
      if (typeof serverData !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: serverData must be a string");
      }
      const { serverSignature } = parseServerFinalMessage(serverData);
      if (serverSignature !== session.serverSignature) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature does not match");
      }
    }
    function isPrintableChars(text2) {
      if (typeof text2 !== "string") {
        throw new TypeError("SASL: text must be a string");
      }
      return text2.split("").map((_, i) => text2.charCodeAt(i)).every((c) => c >= 33 && c <= 43 || c >= 45 && c <= 126);
    }
    function isBase64(text2) {
      return /^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(text2);
    }
    function parseAttributePairs(text2) {
      if (typeof text2 !== "string") {
        throw new TypeError("SASL: attribute pairs text must be a string");
      }
      return new Map(
        text2.split(",").map((attrValue) => {
          if (!/^.=/.test(attrValue)) {
            throw new Error("SASL: Invalid attribute pair entry");
          }
          const name = attrValue[0];
          const value = attrValue.substring(2);
          return [name, value];
        })
      );
    }
    function parseServerFirstMessage(data) {
      const attrPairs = parseAttributePairs(data);
      const nonce = attrPairs.get("r");
      if (!nonce) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing");
      } else if (!isPrintableChars(nonce)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce must only contain printable characters");
      }
      const salt = attrPairs.get("s");
      if (!salt) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing");
      } else if (!isBase64(salt)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt must be base64");
      }
      const iterationText = attrPairs.get("i");
      if (!iterationText) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration missing");
      } else if (!/^[1-9][0-9]*$/.test(iterationText)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: invalid iteration count");
      }
      const iteration = parseInt(iterationText, 10);
      return {
        nonce,
        salt,
        iteration
      };
    }
    function parseServerFinalMessage(serverData) {
      const attrPairs = parseAttributePairs(serverData);
      const serverSignature = attrPairs.get("v");
      if (!serverSignature) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing");
      } else if (!isBase64(serverSignature)) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature must be base64");
      }
      return {
        serverSignature
      };
    }
    function xorBuffers(a, b) {
      if (!Buffer.isBuffer(a)) {
        throw new TypeError("first argument must be a Buffer");
      }
      if (!Buffer.isBuffer(b)) {
        throw new TypeError("second argument must be a Buffer");
      }
      if (a.length !== b.length) {
        throw new Error("Buffer lengths must match");
      }
      if (a.length === 0) {
        throw new Error("Buffers cannot be empty");
      }
      return Buffer.from(a.map((_, i) => a[i] ^ b[i]));
    }
    module.exports = {
      startSession,
      continueSession,
      finalizeSession
    };
  }
});

// node_modules/pg/lib/type-overrides.js
var require_type_overrides = __commonJS({
  "node_modules/pg/lib/type-overrides.js"(exports, module) {
    "use strict";
    var types3 = require_pg_types();
    function TypeOverrides2(userTypes) {
      this._types = userTypes || types3;
      this.text = {};
      this.binary = {};
    }
    TypeOverrides2.prototype.getOverrides = function(format) {
      switch (format) {
        case "text":
          return this.text;
        case "binary":
          return this.binary;
        default:
          return {};
      }
    };
    TypeOverrides2.prototype.setTypeParser = function(oid, format, parseFn) {
      if (typeof format === "function") {
        parseFn = format;
        format = "text";
      }
      this.getOverrides(format)[oid] = parseFn;
    };
    TypeOverrides2.prototype.getTypeParser = function(oid, format) {
      format = format || "text";
      return this.getOverrides(format)[oid] || this._types.getTypeParser(oid, format);
    };
    module.exports = TypeOverrides2;
  }
});

// node_modules/pg-connection-string/index.js
var require_pg_connection_string = __commonJS({
  "node_modules/pg-connection-string/index.js"(exports, module) {
    "use strict";
    function parse(str2, options = {}) {
      if (str2.charAt(0) === "/") {
        const config2 = str2.split(" ");
        return { host: config2[0], database: config2[1] };
      }
      const config = {};
      let result;
      let dummyHost = false;
      if (/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(str2)) {
        str2 = encodeURI(str2).replace(/%25(\d\d)/g, "%$1");
      }
      try {
        try {
          result = new URL(str2, "postgres://base");
        } catch (e) {
          result = new URL(str2.replace("@/", "@___DUMMY___/"), "postgres://base");
          dummyHost = true;
        }
      } catch (err) {
        err.input && (err.input = "*****REDACTED*****");
      }
      for (const entry of result.searchParams.entries()) {
        config[entry[0]] = entry[1];
      }
      config.user = config.user || decodeURIComponent(result.username);
      config.password = config.password || decodeURIComponent(result.password);
      if (result.protocol == "socket:") {
        config.host = decodeURI(result.pathname);
        config.database = result.searchParams.get("db");
        config.client_encoding = result.searchParams.get("encoding");
        return config;
      }
      const hostname = dummyHost ? "" : result.hostname;
      if (!config.host) {
        config.host = decodeURIComponent(hostname);
      } else if (hostname && /^%2f/i.test(hostname)) {
        result.pathname = hostname + result.pathname;
      }
      if (!config.port) {
        config.port = result.port;
      }
      const pathname = result.pathname.slice(1) || null;
      config.database = pathname ? decodeURI(pathname) : null;
      if (config.ssl === "true" || config.ssl === "1") {
        config.ssl = true;
      }
      if (config.ssl === "0") {
        config.ssl = false;
      }
      if (config.sslcert || config.sslkey || config.sslrootcert || config.sslmode) {
        config.ssl = {};
      }
      const fs = config.sslcert || config.sslkey || config.sslrootcert ? __require("fs") : null;
      if (config.sslcert) {
        config.ssl.cert = fs.readFileSync(config.sslcert).toString();
      }
      if (config.sslkey) {
        config.ssl.key = fs.readFileSync(config.sslkey).toString();
      }
      if (config.sslrootcert) {
        config.ssl.ca = fs.readFileSync(config.sslrootcert).toString();
      }
      if (options.useLibpqCompat && config.uselibpqcompat) {
        throw new Error("Both useLibpqCompat and uselibpqcompat are set. Please use only one of them.");
      }
      if (config.uselibpqcompat === "true" || options.useLibpqCompat) {
        switch (config.sslmode) {
          case "disable": {
            config.ssl = false;
            break;
          }
          case "prefer": {
            config.ssl.rejectUnauthorized = false;
            break;
          }
          case "require": {
            if (config.sslrootcert) {
              config.ssl.checkServerIdentity = function() {
              };
            } else {
              config.ssl.rejectUnauthorized = false;
            }
            break;
          }
          case "verify-ca": {
            if (!config.ssl.ca) {
              throw new Error(
                "SECURITY WARNING: Using sslmode=verify-ca requires specifying a CA with sslrootcert. If a public CA is used, verify-ca allows connections to a server that somebody else may have registered with the CA, making you vulnerable to Man-in-the-Middle attacks. Either specify a custom CA certificate with sslrootcert parameter or use sslmode=verify-full for proper security."
              );
            }
            config.ssl.checkServerIdentity = function() {
            };
            break;
          }
          case "verify-full": {
            break;
          }
        }
      } else {
        switch (config.sslmode) {
          case "disable": {
            config.ssl = false;
            break;
          }
          case "prefer":
          case "require":
          case "verify-ca":
          case "verify-full": {
            break;
          }
          case "no-verify": {
            config.ssl.rejectUnauthorized = false;
            break;
          }
        }
      }
      return config;
    }
    function toConnectionOptions(sslConfig) {
      const connectionOptions = Object.entries(sslConfig).reduce((c, [key, value]) => {
        if (value !== void 0 && value !== null) {
          c[key] = value;
        }
        return c;
      }, {});
      return connectionOptions;
    }
    function toClientConfig(config) {
      const poolConfig = Object.entries(config).reduce((c, [key, value]) => {
        if (key === "ssl") {
          const sslConfig = value;
          if (typeof sslConfig === "boolean") {
            c[key] = sslConfig;
          }
          if (typeof sslConfig === "object") {
            c[key] = toConnectionOptions(sslConfig);
          }
        } else if (value !== void 0 && value !== null) {
          if (key === "port") {
            if (value !== "") {
              const v = parseInt(value, 10);
              if (isNaN(v)) {
                throw new Error(`Invalid ${key}: ${value}`);
              }
              c[key] = v;
            }
          } else {
            c[key] = value;
          }
        }
        return c;
      }, {});
      return poolConfig;
    }
    function parseIntoClientConfig(str2) {
      return toClientConfig(parse(str2));
    }
    module.exports = parse;
    parse.parse = parse;
    parse.toClientConfig = toClientConfig;
    parse.parseIntoClientConfig = parseIntoClientConfig;
  }
});

// node_modules/pg/lib/connection-parameters.js
var require_connection_parameters = __commonJS({
  "node_modules/pg/lib/connection-parameters.js"(exports, module) {
    "use strict";
    var dns = __require("dns");
    var defaults3 = require_defaults();
    var parse = require_pg_connection_string().parse;
    var val = function(key, config, envVar) {
      if (envVar === void 0) {
        envVar = process.env["PG" + key.toUpperCase()];
      } else if (envVar === false) {
      } else {
        envVar = process.env[envVar];
      }
      return config[key] || envVar || defaults3[key];
    };
    var readSSLConfigFromEnvironment = function() {
      switch (process.env.PGSSLMODE) {
        case "disable":
          return false;
        case "prefer":
        case "require":
        case "verify-ca":
        case "verify-full":
          return true;
        case "no-verify":
          return { rejectUnauthorized: false };
      }
      return defaults3.ssl;
    };
    var quoteParamValue = function(value) {
      return "'" + ("" + value).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
    };
    var add = function(params, config, paramName) {
      const value = config[paramName];
      if (value !== void 0 && value !== null) {
        params.push(paramName + "=" + quoteParamValue(value));
      }
    };
    var ConnectionParameters = class {
      constructor(config) {
        config = typeof config === "string" ? parse(config) : config || {};
        if (config.connectionString) {
          config = Object.assign({}, config, parse(config.connectionString));
        }
        this.user = val("user", config);
        this.database = val("database", config);
        if (this.database === void 0) {
          this.database = this.user;
        }
        this.port = parseInt(val("port", config), 10);
        this.host = val("host", config);
        Object.defineProperty(this, "password", {
          configurable: true,
          enumerable: false,
          writable: true,
          value: val("password", config)
        });
        this.binary = val("binary", config);
        this.options = val("options", config);
        this.ssl = typeof config.ssl === "undefined" ? readSSLConfigFromEnvironment() : config.ssl;
        if (typeof this.ssl === "string") {
          if (this.ssl === "true") {
            this.ssl = true;
          }
        }
        if (this.ssl === "no-verify") {
          this.ssl = { rejectUnauthorized: false };
        }
        if (this.ssl && this.ssl.key) {
          Object.defineProperty(this.ssl, "key", {
            enumerable: false
          });
        }
        this.client_encoding = val("client_encoding", config);
        this.replication = val("replication", config);
        this.isDomainSocket = !(this.host || "").indexOf("/");
        this.application_name = val("application_name", config, "PGAPPNAME");
        this.fallback_application_name = val("fallback_application_name", config, false);
        this.statement_timeout = val("statement_timeout", config, false);
        this.lock_timeout = val("lock_timeout", config, false);
        this.idle_in_transaction_session_timeout = val("idle_in_transaction_session_timeout", config, false);
        this.query_timeout = val("query_timeout", config, false);
        if (config.connectionTimeoutMillis === void 0) {
          this.connect_timeout = process.env.PGCONNECT_TIMEOUT || 0;
        } else {
          this.connect_timeout = Math.floor(config.connectionTimeoutMillis / 1e3);
        }
        if (config.keepAlive === false) {
          this.keepalives = 0;
        } else if (config.keepAlive === true) {
          this.keepalives = 1;
        }
        if (typeof config.keepAliveInitialDelayMillis === "number") {
          this.keepalives_idle = Math.floor(config.keepAliveInitialDelayMillis / 1e3);
        }
      }
      getLibpqConnectionString(cb) {
        const params = [];
        add(params, this, "user");
        add(params, this, "password");
        add(params, this, "port");
        add(params, this, "application_name");
        add(params, this, "fallback_application_name");
        add(params, this, "connect_timeout");
        add(params, this, "options");
        const ssl = typeof this.ssl === "object" ? this.ssl : this.ssl ? { sslmode: this.ssl } : {};
        add(params, ssl, "sslmode");
        add(params, ssl, "sslca");
        add(params, ssl, "sslkey");
        add(params, ssl, "sslcert");
        add(params, ssl, "sslrootcert");
        if (this.database) {
          params.push("dbname=" + quoteParamValue(this.database));
        }
        if (this.replication) {
          params.push("replication=" + quoteParamValue(this.replication));
        }
        if (this.host) {
          params.push("host=" + quoteParamValue(this.host));
        }
        if (this.isDomainSocket) {
          return cb(null, params.join(" "));
        }
        if (this.client_encoding) {
          params.push("client_encoding=" + quoteParamValue(this.client_encoding));
        }
        dns.lookup(this.host, function(err, address) {
          if (err) return cb(err, null);
          params.push("hostaddr=" + quoteParamValue(address));
          return cb(null, params.join(" "));
        });
      }
    };
    module.exports = ConnectionParameters;
  }
});

// node_modules/pg/lib/result.js
var require_result = __commonJS({
  "node_modules/pg/lib/result.js"(exports, module) {
    "use strict";
    var types3 = require_pg_types();
    var matchRegexp = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/;
    var Result2 = class {
      constructor(rowMode, types4) {
        this.command = null;
        this.rowCount = null;
        this.oid = null;
        this.rows = [];
        this.fields = [];
        this._parsers = void 0;
        this._types = types4;
        this.RowCtor = null;
        this.rowAsArray = rowMode === "array";
        if (this.rowAsArray) {
          this.parseRow = this._parseRowAsArray;
        }
        this._prebuiltEmptyResultObject = null;
      }
      // adds a command complete message
      addCommandComplete(msg) {
        let match;
        if (msg.text) {
          match = matchRegexp.exec(msg.text);
        } else {
          match = matchRegexp.exec(msg.command);
        }
        if (match) {
          this.command = match[1];
          if (match[3]) {
            this.oid = parseInt(match[2], 10);
            this.rowCount = parseInt(match[3], 10);
          } else if (match[2]) {
            this.rowCount = parseInt(match[2], 10);
          }
        }
      }
      _parseRowAsArray(rowData) {
        const row = new Array(rowData.length);
        for (let i = 0, len = rowData.length; i < len; i++) {
          const rawValue = rowData[i];
          if (rawValue !== null) {
            row[i] = this._parsers[i](rawValue);
          } else {
            row[i] = null;
          }
        }
        return row;
      }
      parseRow(rowData) {
        const row = { ...this._prebuiltEmptyResultObject };
        for (let i = 0, len = rowData.length; i < len; i++) {
          const rawValue = rowData[i];
          const field = this.fields[i].name;
          if (rawValue !== null) {
            const v = this.fields[i].format === "binary" ? Buffer.from(rawValue) : rawValue;
            row[field] = this._parsers[i](v);
          } else {
            row[field] = null;
          }
        }
        return row;
      }
      addRow(row) {
        this.rows.push(row);
      }
      addFields(fieldDescriptions) {
        this.fields = fieldDescriptions;
        if (this.fields.length) {
          this._parsers = new Array(fieldDescriptions.length);
        }
        const row = {};
        for (let i = 0; i < fieldDescriptions.length; i++) {
          const desc2 = fieldDescriptions[i];
          row[desc2.name] = null;
          if (this._types) {
            this._parsers[i] = this._types.getTypeParser(desc2.dataTypeID, desc2.format || "text");
          } else {
            this._parsers[i] = types3.getTypeParser(desc2.dataTypeID, desc2.format || "text");
          }
        }
        this._prebuiltEmptyResultObject = { ...row };
      }
    };
    module.exports = Result2;
  }
});

// node_modules/pg/lib/query.js
var require_query = __commonJS({
  "node_modules/pg/lib/query.js"(exports, module) {
    "use strict";
    var { EventEmitter } = __require("events");
    var Result2 = require_result();
    var utils = require_utils();
    var Query2 = class extends EventEmitter {
      constructor(config, values, callback) {
        super();
        config = utils.normalizeQueryConfig(config, values, callback);
        this.text = config.text;
        this.values = config.values;
        this.rows = config.rows;
        this.types = config.types;
        this.name = config.name;
        this.queryMode = config.queryMode;
        this.binary = config.binary;
        this.portal = config.portal || "";
        this.callback = config.callback;
        this._rowMode = config.rowMode;
        if (process.domain && config.callback) {
          this.callback = process.domain.bind(config.callback);
        }
        this._result = new Result2(this._rowMode, this.types);
        this._results = this._result;
        this._canceledDueToError = false;
      }
      requiresPreparation() {
        if (this.queryMode === "extended") {
          return true;
        }
        if (this.name) {
          return true;
        }
        if (this.rows) {
          return true;
        }
        if (!this.text) {
          return false;
        }
        if (!this.values) {
          return false;
        }
        return this.values.length > 0;
      }
      _checkForMultirow() {
        if (this._result.command) {
          if (!Array.isArray(this._results)) {
            this._results = [this._result];
          }
          this._result = new Result2(this._rowMode, this._result._types);
          this._results.push(this._result);
        }
      }
      // associates row metadata from the supplied
      // message with this query object
      // metadata used when parsing row results
      handleRowDescription(msg) {
        this._checkForMultirow();
        this._result.addFields(msg.fields);
        this._accumulateRows = this.callback || !this.listeners("row").length;
      }
      handleDataRow(msg) {
        let row;
        if (this._canceledDueToError) {
          return;
        }
        try {
          row = this._result.parseRow(msg.fields);
        } catch (err) {
          this._canceledDueToError = err;
          return;
        }
        this.emit("row", row, this._result);
        if (this._accumulateRows) {
          this._result.addRow(row);
        }
      }
      handleCommandComplete(msg, connection) {
        this._checkForMultirow();
        this._result.addCommandComplete(msg);
        if (this.rows) {
          connection.sync();
        }
      }
      // if a named prepared statement is created with empty query text
      // the backend will send an emptyQuery message but *not* a command complete message
      // since we pipeline sync immediately after execute we don't need to do anything here
      // unless we have rows specified, in which case we did not pipeline the initial sync call
      handleEmptyQuery(connection) {
        if (this.rows) {
          connection.sync();
        }
      }
      handleError(err, connection) {
        if (this._canceledDueToError) {
          err = this._canceledDueToError;
          this._canceledDueToError = false;
        }
        if (this.callback) {
          return this.callback(err);
        }
        this.emit("error", err);
      }
      handleReadyForQuery(con) {
        if (this._canceledDueToError) {
          return this.handleError(this._canceledDueToError, con);
        }
        if (this.callback) {
          try {
            this.callback(null, this._results);
          } catch (err) {
            process.nextTick(() => {
              throw err;
            });
          }
        }
        this.emit("end", this._results);
      }
      submit(connection) {
        if (typeof this.text !== "string" && typeof this.name !== "string") {
          return new Error("A query must have either text or a name. Supplying neither is unsupported.");
        }
        const previous = connection.parsedStatements[this.name];
        if (this.text && previous && this.text !== previous) {
          return new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
        }
        if (this.values && !Array.isArray(this.values)) {
          return new Error("Query values must be an array");
        }
        if (this.requiresPreparation()) {
          connection.stream.cork && connection.stream.cork();
          try {
            this.prepare(connection);
          } finally {
            connection.stream.uncork && connection.stream.uncork();
          }
        } else {
          connection.query(this.text);
        }
        return null;
      }
      hasBeenParsed(connection) {
        return this.name && connection.parsedStatements[this.name];
      }
      handlePortalSuspended(connection) {
        this._getRows(connection, this.rows);
      }
      _getRows(connection, rows) {
        connection.execute({
          portal: this.portal,
          rows
        });
        if (!rows) {
          connection.sync();
        } else {
          connection.flush();
        }
      }
      // http://developer.postgresql.org/pgdocs/postgres/protocol-flow.html#PROTOCOL-FLOW-EXT-QUERY
      prepare(connection) {
        if (!this.hasBeenParsed(connection)) {
          connection.parse({
            text: this.text,
            name: this.name,
            types: this.types
          });
        }
        try {
          connection.bind({
            portal: this.portal,
            statement: this.name,
            values: this.values,
            binary: this.binary,
            valueMapper: utils.prepareValue
          });
        } catch (err) {
          this.handleError(err, connection);
          return;
        }
        connection.describe({
          type: "P",
          name: this.portal || ""
        });
        this._getRows(connection, this.rows);
      }
      handleCopyInResponse(connection) {
        connection.sendCopyFail("No source stream defined");
      }
      handleCopyData(msg, connection) {
      }
    };
    module.exports = Query2;
  }
});

// node_modules/pg-protocol/dist/messages.js
var require_messages = __commonJS({
  "node_modules/pg-protocol/dist/messages.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoticeMessage = exports.DataRowMessage = exports.CommandCompleteMessage = exports.ReadyForQueryMessage = exports.NotificationResponseMessage = exports.BackendKeyDataMessage = exports.AuthenticationMD5Password = exports.ParameterStatusMessage = exports.ParameterDescriptionMessage = exports.RowDescriptionMessage = exports.Field = exports.CopyResponse = exports.CopyDataMessage = exports.DatabaseError = exports.copyDone = exports.emptyQuery = exports.replicationStart = exports.portalSuspended = exports.noData = exports.closeComplete = exports.bindComplete = exports.parseComplete = void 0;
    exports.parseComplete = {
      name: "parseComplete",
      length: 5
    };
    exports.bindComplete = {
      name: "bindComplete",
      length: 5
    };
    exports.closeComplete = {
      name: "closeComplete",
      length: 5
    };
    exports.noData = {
      name: "noData",
      length: 5
    };
    exports.portalSuspended = {
      name: "portalSuspended",
      length: 5
    };
    exports.replicationStart = {
      name: "replicationStart",
      length: 4
    };
    exports.emptyQuery = {
      name: "emptyQuery",
      length: 4
    };
    exports.copyDone = {
      name: "copyDone",
      length: 4
    };
    var DatabaseError2 = class extends Error {
      constructor(message, length, name) {
        super(message);
        this.length = length;
        this.name = name;
      }
    };
    exports.DatabaseError = DatabaseError2;
    var CopyDataMessage = class {
      constructor(length, chunk) {
        this.length = length;
        this.chunk = chunk;
        this.name = "copyData";
      }
    };
    exports.CopyDataMessage = CopyDataMessage;
    var CopyResponse = class {
      constructor(length, name, binary, columnCount) {
        this.length = length;
        this.name = name;
        this.binary = binary;
        this.columnTypes = new Array(columnCount);
      }
    };
    exports.CopyResponse = CopyResponse;
    var Field = class {
      constructor(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, format) {
        this.name = name;
        this.tableID = tableID;
        this.columnID = columnID;
        this.dataTypeID = dataTypeID;
        this.dataTypeSize = dataTypeSize;
        this.dataTypeModifier = dataTypeModifier;
        this.format = format;
      }
    };
    exports.Field = Field;
    var RowDescriptionMessage = class {
      constructor(length, fieldCount) {
        this.length = length;
        this.fieldCount = fieldCount;
        this.name = "rowDescription";
        this.fields = new Array(this.fieldCount);
      }
    };
    exports.RowDescriptionMessage = RowDescriptionMessage;
    var ParameterDescriptionMessage = class {
      constructor(length, parameterCount) {
        this.length = length;
        this.parameterCount = parameterCount;
        this.name = "parameterDescription";
        this.dataTypeIDs = new Array(this.parameterCount);
      }
    };
    exports.ParameterDescriptionMessage = ParameterDescriptionMessage;
    var ParameterStatusMessage = class {
      constructor(length, parameterName, parameterValue) {
        this.length = length;
        this.parameterName = parameterName;
        this.parameterValue = parameterValue;
        this.name = "parameterStatus";
      }
    };
    exports.ParameterStatusMessage = ParameterStatusMessage;
    var AuthenticationMD5Password = class {
      constructor(length, salt) {
        this.length = length;
        this.salt = salt;
        this.name = "authenticationMD5Password";
      }
    };
    exports.AuthenticationMD5Password = AuthenticationMD5Password;
    var BackendKeyDataMessage = class {
      constructor(length, processID, secretKey) {
        this.length = length;
        this.processID = processID;
        this.secretKey = secretKey;
        this.name = "backendKeyData";
      }
    };
    exports.BackendKeyDataMessage = BackendKeyDataMessage;
    var NotificationResponseMessage = class {
      constructor(length, processId, channel, payload) {
        this.length = length;
        this.processId = processId;
        this.channel = channel;
        this.payload = payload;
        this.name = "notification";
      }
    };
    exports.NotificationResponseMessage = NotificationResponseMessage;
    var ReadyForQueryMessage = class {
      constructor(length, status) {
        this.length = length;
        this.status = status;
        this.name = "readyForQuery";
      }
    };
    exports.ReadyForQueryMessage = ReadyForQueryMessage;
    var CommandCompleteMessage = class {
      constructor(length, text2) {
        this.length = length;
        this.text = text2;
        this.name = "commandComplete";
      }
    };
    exports.CommandCompleteMessage = CommandCompleteMessage;
    var DataRowMessage = class {
      constructor(length, fields) {
        this.length = length;
        this.fields = fields;
        this.name = "dataRow";
        this.fieldCount = fields.length;
      }
    };
    exports.DataRowMessage = DataRowMessage;
    var NoticeMessage = class {
      constructor(length, message) {
        this.length = length;
        this.message = message;
        this.name = "notice";
      }
    };
    exports.NoticeMessage = NoticeMessage;
  }
});

// node_modules/pg-protocol/dist/buffer-writer.js
var require_buffer_writer = __commonJS({
  "node_modules/pg-protocol/dist/buffer-writer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Writer = void 0;
    var Writer = class {
      constructor(size = 256) {
        this.size = size;
        this.offset = 5;
        this.headerPosition = 0;
        this.buffer = Buffer.allocUnsafe(size);
      }
      ensure(size) {
        const remaining = this.buffer.length - this.offset;
        if (remaining < size) {
          const oldBuffer = this.buffer;
          const newSize = oldBuffer.length + (oldBuffer.length >> 1) + size;
          this.buffer = Buffer.allocUnsafe(newSize);
          oldBuffer.copy(this.buffer);
        }
      }
      addInt32(num) {
        this.ensure(4);
        this.buffer[this.offset++] = num >>> 24 & 255;
        this.buffer[this.offset++] = num >>> 16 & 255;
        this.buffer[this.offset++] = num >>> 8 & 255;
        this.buffer[this.offset++] = num >>> 0 & 255;
        return this;
      }
      addInt16(num) {
        this.ensure(2);
        this.buffer[this.offset++] = num >>> 8 & 255;
        this.buffer[this.offset++] = num >>> 0 & 255;
        return this;
      }
      addCString(string) {
        if (!string) {
          this.ensure(1);
        } else {
          const len = Buffer.byteLength(string);
          this.ensure(len + 1);
          this.buffer.write(string, this.offset, "utf-8");
          this.offset += len;
        }
        this.buffer[this.offset++] = 0;
        return this;
      }
      addString(string = "") {
        const len = Buffer.byteLength(string);
        this.ensure(len);
        this.buffer.write(string, this.offset);
        this.offset += len;
        return this;
      }
      add(otherBuffer) {
        this.ensure(otherBuffer.length);
        otherBuffer.copy(this.buffer, this.offset);
        this.offset += otherBuffer.length;
        return this;
      }
      join(code) {
        if (code) {
          this.buffer[this.headerPosition] = code;
          const length = this.offset - (this.headerPosition + 1);
          this.buffer.writeInt32BE(length, this.headerPosition + 1);
        }
        return this.buffer.slice(code ? 0 : 5, this.offset);
      }
      flush(code) {
        const result = this.join(code);
        this.offset = 5;
        this.headerPosition = 0;
        this.buffer = Buffer.allocUnsafe(this.size);
        return result;
      }
    };
    exports.Writer = Writer;
  }
});

// node_modules/pg-protocol/dist/serializer.js
var require_serializer = __commonJS({
  "node_modules/pg-protocol/dist/serializer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.serialize = void 0;
    var buffer_writer_1 = require_buffer_writer();
    var writer = new buffer_writer_1.Writer();
    var startup = (opts) => {
      writer.addInt16(3).addInt16(0);
      for (const key of Object.keys(opts)) {
        writer.addCString(key).addCString(opts[key]);
      }
      writer.addCString("client_encoding").addCString("UTF8");
      const bodyBuffer = writer.addCString("").flush();
      const length = bodyBuffer.length + 4;
      return new buffer_writer_1.Writer().addInt32(length).add(bodyBuffer).flush();
    };
    var requestSsl = () => {
      const response = Buffer.allocUnsafe(8);
      response.writeInt32BE(8, 0);
      response.writeInt32BE(80877103, 4);
      return response;
    };
    var password = (password2) => {
      return writer.addCString(password2).flush(
        112
        /* code.startup */
      );
    };
    var sendSASLInitialResponseMessage = function(mechanism, initialResponse) {
      writer.addCString(mechanism).addInt32(Buffer.byteLength(initialResponse)).addString(initialResponse);
      return writer.flush(
        112
        /* code.startup */
      );
    };
    var sendSCRAMClientFinalMessage = function(additionalData) {
      return writer.addString(additionalData).flush(
        112
        /* code.startup */
      );
    };
    var query = (text2) => {
      return writer.addCString(text2).flush(
        81
        /* code.query */
      );
    };
    var emptyArray = [];
    var parse = (query2) => {
      const name = query2.name || "";
      if (name.length > 63) {
        console.error("Warning! Postgres only supports 63 characters for query names.");
        console.error("You supplied %s (%s)", name, name.length);
        console.error("This can cause conflicts and silent errors executing queries");
      }
      const types3 = query2.types || emptyArray;
      const len = types3.length;
      const buffer = writer.addCString(name).addCString(query2.text).addInt16(len);
      for (let i = 0; i < len; i++) {
        buffer.addInt32(types3[i]);
      }
      return writer.flush(
        80
        /* code.parse */
      );
    };
    var paramWriter = new buffer_writer_1.Writer();
    var writeValues = function(values, valueMapper) {
      for (let i = 0; i < values.length; i++) {
        const mappedVal = valueMapper ? valueMapper(values[i], i) : values[i];
        if (mappedVal == null) {
          writer.addInt16(
            0
            /* ParamType.STRING */
          );
          paramWriter.addInt32(-1);
        } else if (mappedVal instanceof Buffer) {
          writer.addInt16(
            1
            /* ParamType.BINARY */
          );
          paramWriter.addInt32(mappedVal.length);
          paramWriter.add(mappedVal);
        } else {
          writer.addInt16(
            0
            /* ParamType.STRING */
          );
          paramWriter.addInt32(Buffer.byteLength(mappedVal));
          paramWriter.addString(mappedVal);
        }
      }
    };
    var bind = (config = {}) => {
      const portal = config.portal || "";
      const statement = config.statement || "";
      const binary = config.binary || false;
      const values = config.values || emptyArray;
      const len = values.length;
      writer.addCString(portal).addCString(statement);
      writer.addInt16(len);
      writeValues(values, config.valueMapper);
      writer.addInt16(len);
      writer.add(paramWriter.flush());
      writer.addInt16(1);
      writer.addInt16(
        binary ? 1 : 0
        /* ParamType.STRING */
      );
      return writer.flush(
        66
        /* code.bind */
      );
    };
    var emptyExecute = Buffer.from([69, 0, 0, 0, 9, 0, 0, 0, 0, 0]);
    var execute = (config) => {
      if (!config || !config.portal && !config.rows) {
        return emptyExecute;
      }
      const portal = config.portal || "";
      const rows = config.rows || 0;
      const portalLength = Buffer.byteLength(portal);
      const len = 4 + portalLength + 1 + 4;
      const buff = Buffer.allocUnsafe(1 + len);
      buff[0] = 69;
      buff.writeInt32BE(len, 1);
      buff.write(portal, 5, "utf-8");
      buff[portalLength + 5] = 0;
      buff.writeUInt32BE(rows, buff.length - 4);
      return buff;
    };
    var cancel = (processID, secretKey) => {
      const buffer = Buffer.allocUnsafe(16);
      buffer.writeInt32BE(16, 0);
      buffer.writeInt16BE(1234, 4);
      buffer.writeInt16BE(5678, 6);
      buffer.writeInt32BE(processID, 8);
      buffer.writeInt32BE(secretKey, 12);
      return buffer;
    };
    var cstringMessage = (code, string) => {
      const stringLen = Buffer.byteLength(string);
      const len = 4 + stringLen + 1;
      const buffer = Buffer.allocUnsafe(1 + len);
      buffer[0] = code;
      buffer.writeInt32BE(len, 1);
      buffer.write(string, 5, "utf-8");
      buffer[len] = 0;
      return buffer;
    };
    var emptyDescribePortal = writer.addCString("P").flush(
      68
      /* code.describe */
    );
    var emptyDescribeStatement = writer.addCString("S").flush(
      68
      /* code.describe */
    );
    var describe = (msg) => {
      return msg.name ? cstringMessage(68, `${msg.type}${msg.name || ""}`) : msg.type === "P" ? emptyDescribePortal : emptyDescribeStatement;
    };
    var close = (msg) => {
      const text2 = `${msg.type}${msg.name || ""}`;
      return cstringMessage(67, text2);
    };
    var copyData = (chunk) => {
      return writer.add(chunk).flush(
        100
        /* code.copyFromChunk */
      );
    };
    var copyFail = (message) => {
      return cstringMessage(102, message);
    };
    var codeOnlyBuffer = (code) => Buffer.from([code, 0, 0, 0, 4]);
    var flushBuffer = codeOnlyBuffer(
      72
      /* code.flush */
    );
    var syncBuffer = codeOnlyBuffer(
      83
      /* code.sync */
    );
    var endBuffer = codeOnlyBuffer(
      88
      /* code.end */
    );
    var copyDoneBuffer = codeOnlyBuffer(
      99
      /* code.copyDone */
    );
    var serialize = {
      startup,
      password,
      requestSsl,
      sendSASLInitialResponseMessage,
      sendSCRAMClientFinalMessage,
      query,
      parse,
      bind,
      execute,
      describe,
      close,
      flush: () => flushBuffer,
      sync: () => syncBuffer,
      end: () => endBuffer,
      copyData,
      copyDone: () => copyDoneBuffer,
      copyFail,
      cancel
    };
    exports.serialize = serialize;
  }
});

// node_modules/pg-protocol/dist/buffer-reader.js
var require_buffer_reader = __commonJS({
  "node_modules/pg-protocol/dist/buffer-reader.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BufferReader = void 0;
    var emptyBuffer = Buffer.allocUnsafe(0);
    var BufferReader = class {
      constructor(offset = 0) {
        this.offset = offset;
        this.buffer = emptyBuffer;
        this.encoding = "utf-8";
      }
      setBuffer(offset, buffer) {
        this.offset = offset;
        this.buffer = buffer;
      }
      int16() {
        const result = this.buffer.readInt16BE(this.offset);
        this.offset += 2;
        return result;
      }
      byte() {
        const result = this.buffer[this.offset];
        this.offset++;
        return result;
      }
      int32() {
        const result = this.buffer.readInt32BE(this.offset);
        this.offset += 4;
        return result;
      }
      uint32() {
        const result = this.buffer.readUInt32BE(this.offset);
        this.offset += 4;
        return result;
      }
      string(length) {
        const result = this.buffer.toString(this.encoding, this.offset, this.offset + length);
        this.offset += length;
        return result;
      }
      cstring() {
        const start = this.offset;
        let end = start;
        while (this.buffer[end++] !== 0) {
        }
        this.offset = end;
        return this.buffer.toString(this.encoding, start, end - 1);
      }
      bytes(length) {
        const result = this.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        return result;
      }
    };
    exports.BufferReader = BufferReader;
  }
});

// node_modules/pg-protocol/dist/parser.js
var require_parser = __commonJS({
  "node_modules/pg-protocol/dist/parser.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Parser = void 0;
    var messages_1 = require_messages();
    var buffer_reader_1 = require_buffer_reader();
    var CODE_LENGTH = 1;
    var LEN_LENGTH = 4;
    var HEADER_LENGTH = CODE_LENGTH + LEN_LENGTH;
    var emptyBuffer = Buffer.allocUnsafe(0);
    var Parser = class {
      constructor(opts) {
        this.buffer = emptyBuffer;
        this.bufferLength = 0;
        this.bufferOffset = 0;
        this.reader = new buffer_reader_1.BufferReader();
        if ((opts === null || opts === void 0 ? void 0 : opts.mode) === "binary") {
          throw new Error("Binary mode not supported yet");
        }
        this.mode = (opts === null || opts === void 0 ? void 0 : opts.mode) || "text";
      }
      parse(buffer, callback) {
        this.mergeBuffer(buffer);
        const bufferFullLength = this.bufferOffset + this.bufferLength;
        let offset = this.bufferOffset;
        while (offset + HEADER_LENGTH <= bufferFullLength) {
          const code = this.buffer[offset];
          const length = this.buffer.readUInt32BE(offset + CODE_LENGTH);
          const fullMessageLength = CODE_LENGTH + length;
          if (fullMessageLength + offset <= bufferFullLength) {
            const message = this.handlePacket(offset + HEADER_LENGTH, code, length, this.buffer);
            callback(message);
            offset += fullMessageLength;
          } else {
            break;
          }
        }
        if (offset === bufferFullLength) {
          this.buffer = emptyBuffer;
          this.bufferLength = 0;
          this.bufferOffset = 0;
        } else {
          this.bufferLength = bufferFullLength - offset;
          this.bufferOffset = offset;
        }
      }
      mergeBuffer(buffer) {
        if (this.bufferLength > 0) {
          const newLength = this.bufferLength + buffer.byteLength;
          const newFullLength = newLength + this.bufferOffset;
          if (newFullLength > this.buffer.byteLength) {
            let newBuffer;
            if (newLength <= this.buffer.byteLength && this.bufferOffset >= this.bufferLength) {
              newBuffer = this.buffer;
            } else {
              let newBufferLength = this.buffer.byteLength * 2;
              while (newLength >= newBufferLength) {
                newBufferLength *= 2;
              }
              newBuffer = Buffer.allocUnsafe(newBufferLength);
            }
            this.buffer.copy(newBuffer, 0, this.bufferOffset, this.bufferOffset + this.bufferLength);
            this.buffer = newBuffer;
            this.bufferOffset = 0;
          }
          buffer.copy(this.buffer, this.bufferOffset + this.bufferLength);
          this.bufferLength = newLength;
        } else {
          this.buffer = buffer;
          this.bufferOffset = 0;
          this.bufferLength = buffer.byteLength;
        }
      }
      handlePacket(offset, code, length, bytes) {
        switch (code) {
          case 50:
            return messages_1.bindComplete;
          case 49:
            return messages_1.parseComplete;
          case 51:
            return messages_1.closeComplete;
          case 110:
            return messages_1.noData;
          case 115:
            return messages_1.portalSuspended;
          case 99:
            return messages_1.copyDone;
          case 87:
            return messages_1.replicationStart;
          case 73:
            return messages_1.emptyQuery;
          case 68:
            return this.parseDataRowMessage(offset, length, bytes);
          case 67:
            return this.parseCommandCompleteMessage(offset, length, bytes);
          case 90:
            return this.parseReadyForQueryMessage(offset, length, bytes);
          case 65:
            return this.parseNotificationMessage(offset, length, bytes);
          case 82:
            return this.parseAuthenticationResponse(offset, length, bytes);
          case 83:
            return this.parseParameterStatusMessage(offset, length, bytes);
          case 75:
            return this.parseBackendKeyData(offset, length, bytes);
          case 69:
            return this.parseErrorMessage(offset, length, bytes, "error");
          case 78:
            return this.parseErrorMessage(offset, length, bytes, "notice");
          case 84:
            return this.parseRowDescriptionMessage(offset, length, bytes);
          case 116:
            return this.parseParameterDescriptionMessage(offset, length, bytes);
          case 71:
            return this.parseCopyInMessage(offset, length, bytes);
          case 72:
            return this.parseCopyOutMessage(offset, length, bytes);
          case 100:
            return this.parseCopyData(offset, length, bytes);
          default:
            return new messages_1.DatabaseError("received invalid response: " + code.toString(16), length, "error");
        }
      }
      parseReadyForQueryMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const status = this.reader.string(1);
        return new messages_1.ReadyForQueryMessage(length, status);
      }
      parseCommandCompleteMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const text2 = this.reader.cstring();
        return new messages_1.CommandCompleteMessage(length, text2);
      }
      parseCopyData(offset, length, bytes) {
        const chunk = bytes.slice(offset, offset + (length - 4));
        return new messages_1.CopyDataMessage(length, chunk);
      }
      parseCopyInMessage(offset, length, bytes) {
        return this.parseCopyMessage(offset, length, bytes, "copyInResponse");
      }
      parseCopyOutMessage(offset, length, bytes) {
        return this.parseCopyMessage(offset, length, bytes, "copyOutResponse");
      }
      parseCopyMessage(offset, length, bytes, messageName) {
        this.reader.setBuffer(offset, bytes);
        const isBinary = this.reader.byte() !== 0;
        const columnCount = this.reader.int16();
        const message = new messages_1.CopyResponse(length, messageName, isBinary, columnCount);
        for (let i = 0; i < columnCount; i++) {
          message.columnTypes[i] = this.reader.int16();
        }
        return message;
      }
      parseNotificationMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const processId = this.reader.int32();
        const channel = this.reader.cstring();
        const payload = this.reader.cstring();
        return new messages_1.NotificationResponseMessage(length, processId, channel, payload);
      }
      parseRowDescriptionMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const fieldCount = this.reader.int16();
        const message = new messages_1.RowDescriptionMessage(length, fieldCount);
        for (let i = 0; i < fieldCount; i++) {
          message.fields[i] = this.parseField();
        }
        return message;
      }
      parseField() {
        const name = this.reader.cstring();
        const tableID = this.reader.uint32();
        const columnID = this.reader.int16();
        const dataTypeID = this.reader.uint32();
        const dataTypeSize = this.reader.int16();
        const dataTypeModifier = this.reader.int32();
        const mode = this.reader.int16() === 0 ? "text" : "binary";
        return new messages_1.Field(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, mode);
      }
      parseParameterDescriptionMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const parameterCount = this.reader.int16();
        const message = new messages_1.ParameterDescriptionMessage(length, parameterCount);
        for (let i = 0; i < parameterCount; i++) {
          message.dataTypeIDs[i] = this.reader.int32();
        }
        return message;
      }
      parseDataRowMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const fieldCount = this.reader.int16();
        const fields = new Array(fieldCount);
        for (let i = 0; i < fieldCount; i++) {
          const len = this.reader.int32();
          fields[i] = len === -1 ? null : this.reader.string(len);
        }
        return new messages_1.DataRowMessage(length, fields);
      }
      parseParameterStatusMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const name = this.reader.cstring();
        const value = this.reader.cstring();
        return new messages_1.ParameterStatusMessage(length, name, value);
      }
      parseBackendKeyData(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const processID = this.reader.int32();
        const secretKey = this.reader.int32();
        return new messages_1.BackendKeyDataMessage(length, processID, secretKey);
      }
      parseAuthenticationResponse(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const code = this.reader.int32();
        const message = {
          name: "authenticationOk",
          length
        };
        switch (code) {
          case 0:
            break;
          case 3:
            if (message.length === 8) {
              message.name = "authenticationCleartextPassword";
            }
            break;
          case 5:
            if (message.length === 12) {
              message.name = "authenticationMD5Password";
              const salt = this.reader.bytes(4);
              return new messages_1.AuthenticationMD5Password(length, salt);
            }
            break;
          case 10:
            {
              message.name = "authenticationSASL";
              message.mechanisms = [];
              let mechanism;
              do {
                mechanism = this.reader.cstring();
                if (mechanism) {
                  message.mechanisms.push(mechanism);
                }
              } while (mechanism);
            }
            break;
          case 11:
            message.name = "authenticationSASLContinue";
            message.data = this.reader.string(length - 8);
            break;
          case 12:
            message.name = "authenticationSASLFinal";
            message.data = this.reader.string(length - 8);
            break;
          default:
            throw new Error("Unknown authenticationOk message type " + code);
        }
        return message;
      }
      parseErrorMessage(offset, length, bytes, name) {
        this.reader.setBuffer(offset, bytes);
        const fields = {};
        let fieldType = this.reader.string(1);
        while (fieldType !== "\0") {
          fields[fieldType] = this.reader.cstring();
          fieldType = this.reader.string(1);
        }
        const messageValue = fields.M;
        const message = name === "notice" ? new messages_1.NoticeMessage(length, messageValue) : new messages_1.DatabaseError(messageValue, length, name);
        message.severity = fields.S;
        message.code = fields.C;
        message.detail = fields.D;
        message.hint = fields.H;
        message.position = fields.P;
        message.internalPosition = fields.p;
        message.internalQuery = fields.q;
        message.where = fields.W;
        message.schema = fields.s;
        message.table = fields.t;
        message.column = fields.c;
        message.dataType = fields.d;
        message.constraint = fields.n;
        message.file = fields.F;
        message.line = fields.L;
        message.routine = fields.R;
        return message;
      }
    };
    exports.Parser = Parser;
  }
});

// node_modules/pg-protocol/dist/index.js
var require_dist = __commonJS({
  "node_modules/pg-protocol/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DatabaseError = exports.serialize = exports.parse = void 0;
    var messages_1 = require_messages();
    Object.defineProperty(exports, "DatabaseError", { enumerable: true, get: function() {
      return messages_1.DatabaseError;
    } });
    var serializer_1 = require_serializer();
    Object.defineProperty(exports, "serialize", { enumerable: true, get: function() {
      return serializer_1.serialize;
    } });
    var parser_1 = require_parser();
    function parse(stream, callback) {
      const parser = new parser_1.Parser();
      stream.on("data", (buffer) => parser.parse(buffer, callback));
      return new Promise((resolve) => stream.on("end", () => resolve()));
    }
    exports.parse = parse;
  }
});

// node_modules/pg-cloudflare/dist/empty.js
var require_empty = __commonJS({
  "node_modules/pg-cloudflare/dist/empty.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = {};
  }
});

// node_modules/pg/lib/stream.js
var require_stream = __commonJS({
  "node_modules/pg/lib/stream.js"(exports, module) {
    var { getStream, getSecureStream } = getStreamFuncs();
    module.exports = {
      /**
       * Get a socket stream compatible with the current runtime environment.
       * @returns {Duplex}
       */
      getStream,
      /**
       * Get a TLS secured socket, compatible with the current environment,
       * using the socket and other settings given in `options`.
       * @returns {Duplex}
       */
      getSecureStream
    };
    function getNodejsStreamFuncs() {
      function getStream2(ssl) {
        const net = __require("net");
        return new net.Socket();
      }
      function getSecureStream2(options) {
        const tls = __require("tls");
        return tls.connect(options);
      }
      return {
        getStream: getStream2,
        getSecureStream: getSecureStream2
      };
    }
    function getCloudflareStreamFuncs() {
      function getStream2(ssl) {
        const { CloudflareSocket } = require_empty();
        return new CloudflareSocket(ssl);
      }
      function getSecureStream2(options) {
        options.socket.startTls(options);
        return options.socket;
      }
      return {
        getStream: getStream2,
        getSecureStream: getSecureStream2
      };
    }
    function isCloudflareRuntime() {
      if (typeof navigator === "object" && navigator !== null && typeof navigator.userAgent === "string") {
        return navigator.userAgent === "Cloudflare-Workers";
      }
      if (typeof Response === "function") {
        const resp = new Response(null, { cf: { thing: true } });
        if (typeof resp.cf === "object" && resp.cf !== null && resp.cf.thing) {
          return true;
        }
      }
      return false;
    }
    function getStreamFuncs() {
      if (isCloudflareRuntime()) {
        return getCloudflareStreamFuncs();
      }
      return getNodejsStreamFuncs();
    }
  }
});

// node_modules/pg/lib/connection.js
var require_connection = __commonJS({
  "node_modules/pg/lib/connection.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events").EventEmitter;
    var { parse, serialize } = require_dist();
    var { getStream, getSecureStream } = require_stream();
    var flushBuffer = serialize.flush();
    var syncBuffer = serialize.sync();
    var endBuffer = serialize.end();
    var Connection2 = class extends EventEmitter {
      constructor(config) {
        super();
        config = config || {};
        this.stream = config.stream || getStream(config.ssl);
        if (typeof this.stream === "function") {
          this.stream = this.stream(config);
        }
        this._keepAlive = config.keepAlive;
        this._keepAliveInitialDelayMillis = config.keepAliveInitialDelayMillis;
        this.lastBuffer = false;
        this.parsedStatements = {};
        this.ssl = config.ssl || false;
        this._ending = false;
        this._emitMessage = false;
        const self = this;
        this.on("newListener", function(eventName) {
          if (eventName === "message") {
            self._emitMessage = true;
          }
        });
      }
      connect(port, host) {
        const self = this;
        this._connecting = true;
        this.stream.setNoDelay(true);
        this.stream.connect(port, host);
        this.stream.once("connect", function() {
          if (self._keepAlive) {
            self.stream.setKeepAlive(true, self._keepAliveInitialDelayMillis);
          }
          self.emit("connect");
        });
        const reportStreamError = function(error) {
          if (self._ending && (error.code === "ECONNRESET" || error.code === "EPIPE")) {
            return;
          }
          self.emit("error", error);
        };
        this.stream.on("error", reportStreamError);
        this.stream.on("close", function() {
          self.emit("end");
        });
        if (!this.ssl) {
          return this.attachListeners(this.stream);
        }
        this.stream.once("data", function(buffer) {
          const responseCode = buffer.toString("utf8");
          switch (responseCode) {
            case "S":
              break;
            case "N":
              self.stream.end();
              return self.emit("error", new Error("The server does not support SSL connections"));
            default:
              self.stream.end();
              return self.emit("error", new Error("There was an error establishing an SSL connection"));
          }
          const options = {
            socket: self.stream
          };
          if (self.ssl !== true) {
            Object.assign(options, self.ssl);
            if ("key" in self.ssl) {
              options.key = self.ssl.key;
            }
          }
          const net = __require("net");
          if (net.isIP && net.isIP(host) === 0) {
            options.servername = host;
          }
          try {
            self.stream = getSecureStream(options);
          } catch (err) {
            return self.emit("error", err);
          }
          self.attachListeners(self.stream);
          self.stream.on("error", reportStreamError);
          self.emit("sslconnect");
        });
      }
      attachListeners(stream) {
        parse(stream, (msg) => {
          const eventName = msg.name === "error" ? "errorMessage" : msg.name;
          if (this._emitMessage) {
            this.emit("message", msg);
          }
          this.emit(eventName, msg);
        });
      }
      requestSsl() {
        this.stream.write(serialize.requestSsl());
      }
      startup(config) {
        this.stream.write(serialize.startup(config));
      }
      cancel(processID, secretKey) {
        this._send(serialize.cancel(processID, secretKey));
      }
      password(password) {
        this._send(serialize.password(password));
      }
      sendSASLInitialResponseMessage(mechanism, initialResponse) {
        this._send(serialize.sendSASLInitialResponseMessage(mechanism, initialResponse));
      }
      sendSCRAMClientFinalMessage(additionalData) {
        this._send(serialize.sendSCRAMClientFinalMessage(additionalData));
      }
      _send(buffer) {
        if (!this.stream.writable) {
          return false;
        }
        return this.stream.write(buffer);
      }
      query(text2) {
        this._send(serialize.query(text2));
      }
      // send parse message
      parse(query) {
        this._send(serialize.parse(query));
      }
      // send bind message
      bind(config) {
        this._send(serialize.bind(config));
      }
      // send execute message
      execute(config) {
        this._send(serialize.execute(config));
      }
      flush() {
        if (this.stream.writable) {
          this.stream.write(flushBuffer);
        }
      }
      sync() {
        this._ending = true;
        this._send(syncBuffer);
      }
      ref() {
        this.stream.ref();
      }
      unref() {
        this.stream.unref();
      }
      end() {
        this._ending = true;
        if (!this._connecting || !this.stream.writable) {
          this.stream.end();
          return;
        }
        return this.stream.write(endBuffer, () => {
          this.stream.end();
        });
      }
      close(msg) {
        this._send(serialize.close(msg));
      }
      describe(msg) {
        this._send(serialize.describe(msg));
      }
      sendCopyFromChunk(chunk) {
        this._send(serialize.copyData(chunk));
      }
      endCopyFrom() {
        this._send(serialize.copyDone());
      }
      sendCopyFail(msg) {
        this._send(serialize.copyFail(msg));
      }
    };
    module.exports = Connection2;
  }
});

// node_modules/split2/index.js
var require_split2 = __commonJS({
  "node_modules/split2/index.js"(exports, module) {
    "use strict";
    var { Transform } = __require("stream");
    var { StringDecoder } = __require("string_decoder");
    var kLast = Symbol("last");
    var kDecoder = Symbol("decoder");
    function transform(chunk, enc, cb) {
      let list;
      if (this.overflow) {
        const buf = this[kDecoder].write(chunk);
        list = buf.split(this.matcher);
        if (list.length === 1) return cb();
        list.shift();
        this.overflow = false;
      } else {
        this[kLast] += this[kDecoder].write(chunk);
        list = this[kLast].split(this.matcher);
      }
      this[kLast] = list.pop();
      for (let i = 0; i < list.length; i++) {
        try {
          push(this, this.mapper(list[i]));
        } catch (error) {
          return cb(error);
        }
      }
      this.overflow = this[kLast].length > this.maxLength;
      if (this.overflow && !this.skipOverflow) {
        cb(new Error("maximum buffer reached"));
        return;
      }
      cb();
    }
    function flush(cb) {
      this[kLast] += this[kDecoder].end();
      if (this[kLast]) {
        try {
          push(this, this.mapper(this[kLast]));
        } catch (error) {
          return cb(error);
        }
      }
      cb();
    }
    function push(self, val) {
      if (val !== void 0) {
        self.push(val);
      }
    }
    function noop2(incoming) {
      return incoming;
    }
    function split(matcher, mapper, options) {
      matcher = matcher || /\r?\n/;
      mapper = mapper || noop2;
      options = options || {};
      switch (arguments.length) {
        case 1:
          if (typeof matcher === "function") {
            mapper = matcher;
            matcher = /\r?\n/;
          } else if (typeof matcher === "object" && !(matcher instanceof RegExp) && !matcher[Symbol.split]) {
            options = matcher;
            matcher = /\r?\n/;
          }
          break;
        case 2:
          if (typeof matcher === "function") {
            options = mapper;
            mapper = matcher;
            matcher = /\r?\n/;
          } else if (typeof mapper === "object") {
            options = mapper;
            mapper = noop2;
          }
      }
      options = Object.assign({}, options);
      options.autoDestroy = true;
      options.transform = transform;
      options.flush = flush;
      options.readableObjectMode = true;
      const stream = new Transform(options);
      stream[kLast] = "";
      stream[kDecoder] = new StringDecoder("utf8");
      stream.matcher = matcher;
      stream.mapper = mapper;
      stream.maxLength = options.maxLength;
      stream.skipOverflow = options.skipOverflow || false;
      stream.overflow = false;
      stream._destroy = function(err, cb) {
        this._writableState.errorEmitted = false;
        cb(err);
      };
      return stream;
    }
    module.exports = split;
  }
});

// node_modules/pgpass/lib/helper.js
var require_helper = __commonJS({
  "node_modules/pgpass/lib/helper.js"(exports, module) {
    "use strict";
    var path2 = __require("path");
    var Stream2 = __require("stream").Stream;
    var split = require_split2();
    var util2 = __require("util");
    var defaultPort = 5432;
    var isWin = process.platform === "win32";
    var warnStream = process.stderr;
    var S_IRWXG = 56;
    var S_IRWXO = 7;
    var S_IFMT = 61440;
    var S_IFREG = 32768;
    function isRegFile(mode) {
      return (mode & S_IFMT) == S_IFREG;
    }
    var fieldNames = ["host", "port", "database", "user", "password"];
    var nrOfFields = fieldNames.length;
    var passKey = fieldNames[nrOfFields - 1];
    function warn() {
      var isWritable = warnStream instanceof Stream2 && true === warnStream.writable;
      if (isWritable) {
        var args = Array.prototype.slice.call(arguments).concat("\n");
        warnStream.write(util2.format.apply(util2, args));
      }
    }
    Object.defineProperty(module.exports, "isWin", {
      get: function() {
        return isWin;
      },
      set: function(val) {
        isWin = val;
      }
    });
    module.exports.warnTo = function(stream) {
      var old = warnStream;
      warnStream = stream;
      return old;
    };
    module.exports.getFileName = function(rawEnv) {
      var env = rawEnv || process.env;
      var file = env.PGPASSFILE || (isWin ? path2.join(env.APPDATA || "./", "postgresql", "pgpass.conf") : path2.join(env.HOME || "./", ".pgpass"));
      return file;
    };
    module.exports.usePgPass = function(stats, fname) {
      if (Object.prototype.hasOwnProperty.call(process.env, "PGPASSWORD")) {
        return false;
      }
      if (isWin) {
        return true;
      }
      fname = fname || "<unkn>";
      if (!isRegFile(stats.mode)) {
        warn('WARNING: password file "%s" is not a plain file', fname);
        return false;
      }
      if (stats.mode & (S_IRWXG | S_IRWXO)) {
        warn('WARNING: password file "%s" has group or world access; permissions should be u=rw (0600) or less', fname);
        return false;
      }
      return true;
    };
    var matcher = module.exports.match = function(connInfo, entry) {
      return fieldNames.slice(0, -1).reduce(function(prev, field, idx) {
        if (idx == 1) {
          if (Number(connInfo[field] || defaultPort) === Number(entry[field])) {
            return prev && true;
          }
        }
        return prev && (entry[field] === "*" || entry[field] === connInfo[field]);
      }, true);
    };
    module.exports.getPassword = function(connInfo, stream, cb) {
      var pass;
      var lineStream = stream.pipe(split());
      function onLine(line2) {
        var entry = parseLine(line2);
        if (entry && isValidEntry(entry) && matcher(connInfo, entry)) {
          pass = entry[passKey];
          lineStream.end();
        }
      }
      var onEnd = function() {
        stream.destroy();
        cb(pass);
      };
      var onErr = function(err) {
        stream.destroy();
        warn("WARNING: error on reading file: %s", err);
        cb(void 0);
      };
      stream.on("error", onErr);
      lineStream.on("data", onLine).on("end", onEnd).on("error", onErr);
    };
    var parseLine = module.exports.parseLine = function(line2) {
      if (line2.length < 11 || line2.match(/^\s+#/)) {
        return null;
      }
      var curChar = "";
      var prevChar = "";
      var fieldIdx = 0;
      var startIdx = 0;
      var endIdx = 0;
      var obj = {};
      var isLastField = false;
      var addToObj = function(idx, i0, i1) {
        var field = line2.substring(i0, i1);
        if (!Object.hasOwnProperty.call(process.env, "PGPASS_NO_DEESCAPE")) {
          field = field.replace(/\\([:\\])/g, "$1");
        }
        obj[fieldNames[idx]] = field;
      };
      for (var i = 0; i < line2.length - 1; i += 1) {
        curChar = line2.charAt(i + 1);
        prevChar = line2.charAt(i);
        isLastField = fieldIdx == nrOfFields - 1;
        if (isLastField) {
          addToObj(fieldIdx, startIdx);
          break;
        }
        if (i >= 0 && curChar == ":" && prevChar !== "\\") {
          addToObj(fieldIdx, startIdx, i + 1);
          startIdx = i + 2;
          fieldIdx += 1;
        }
      }
      obj = Object.keys(obj).length === nrOfFields ? obj : null;
      return obj;
    };
    var isValidEntry = module.exports.isValidEntry = function(entry) {
      var rules = {
        // host
        0: function(x) {
          return x.length > 0;
        },
        // port
        1: function(x) {
          if (x === "*") {
            return true;
          }
          x = Number(x);
          return isFinite(x) && x > 0 && x < 9007199254740992 && Math.floor(x) === x;
        },
        // database
        2: function(x) {
          return x.length > 0;
        },
        // username
        3: function(x) {
          return x.length > 0;
        },
        // password
        4: function(x) {
          return x.length > 0;
        }
      };
      for (var idx = 0; idx < fieldNames.length; idx += 1) {
        var rule = rules[idx];
        var value = entry[fieldNames[idx]] || "";
        var res = rule(value);
        if (!res) {
          return false;
        }
      }
      return true;
    };
  }
});

// node_modules/pgpass/lib/index.js
var require_lib = __commonJS({
  "node_modules/pgpass/lib/index.js"(exports, module) {
    "use strict";
    var path2 = __require("path");
    var fs = __require("fs");
    var helper = require_helper();
    module.exports = function(connInfo, cb) {
      var file = helper.getFileName();
      fs.stat(file, function(err, stat) {
        if (err || !helper.usePgPass(stat, file)) {
          return cb(void 0);
        }
        var st = fs.createReadStream(file);
        helper.getPassword(connInfo, st, cb);
      });
    };
    module.exports.warnTo = helper.warnTo;
  }
});

// node_modules/pg/lib/client.js
var require_client = __commonJS({
  "node_modules/pg/lib/client.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events").EventEmitter;
    var utils = require_utils();
    var sasl = require_sasl();
    var TypeOverrides2 = require_type_overrides();
    var ConnectionParameters = require_connection_parameters();
    var Query2 = require_query();
    var defaults3 = require_defaults();
    var Connection2 = require_connection();
    var crypto2 = require_utils2();
    var Client2 = class extends EventEmitter {
      constructor(config) {
        super();
        this.connectionParameters = new ConnectionParameters(config);
        this.user = this.connectionParameters.user;
        this.database = this.connectionParameters.database;
        this.port = this.connectionParameters.port;
        this.host = this.connectionParameters.host;
        Object.defineProperty(this, "password", {
          configurable: true,
          enumerable: false,
          writable: true,
          value: this.connectionParameters.password
        });
        this.replication = this.connectionParameters.replication;
        const c = config || {};
        this._Promise = c.Promise || global.Promise;
        this._types = new TypeOverrides2(c.types);
        this._ending = false;
        this._ended = false;
        this._connecting = false;
        this._connected = false;
        this._connectionError = false;
        this._queryable = true;
        this.enableChannelBinding = Boolean(c.enableChannelBinding);
        this.connection = c.connection || new Connection2({
          stream: c.stream,
          ssl: this.connectionParameters.ssl,
          keepAlive: c.keepAlive || false,
          keepAliveInitialDelayMillis: c.keepAliveInitialDelayMillis || 0,
          encoding: this.connectionParameters.client_encoding || "utf8"
        });
        this.queryQueue = [];
        this.binary = c.binary || defaults3.binary;
        this.processID = null;
        this.secretKey = null;
        this.ssl = this.connectionParameters.ssl || false;
        if (this.ssl && this.ssl.key) {
          Object.defineProperty(this.ssl, "key", {
            enumerable: false
          });
        }
        this._connectionTimeoutMillis = c.connectionTimeoutMillis || 0;
      }
      _errorAllQueries(err) {
        const enqueueError = (query) => {
          process.nextTick(() => {
            query.handleError(err, this.connection);
          });
        };
        if (this.activeQuery) {
          enqueueError(this.activeQuery);
          this.activeQuery = null;
        }
        this.queryQueue.forEach(enqueueError);
        this.queryQueue.length = 0;
      }
      _connect(callback) {
        const self = this;
        const con = this.connection;
        this._connectionCallback = callback;
        if (this._connecting || this._connected) {
          const err = new Error("Client has already been connected. You cannot reuse a client.");
          process.nextTick(() => {
            callback(err);
          });
          return;
        }
        this._connecting = true;
        if (this._connectionTimeoutMillis > 0) {
          this.connectionTimeoutHandle = setTimeout(() => {
            con._ending = true;
            con.stream.destroy(new Error("timeout expired"));
          }, this._connectionTimeoutMillis);
          if (this.connectionTimeoutHandle.unref) {
            this.connectionTimeoutHandle.unref();
          }
        }
        if (this.host && this.host.indexOf("/") === 0) {
          con.connect(this.host + "/.s.PGSQL." + this.port);
        } else {
          con.connect(this.port, this.host);
        }
        con.on("connect", function() {
          if (self.ssl) {
            con.requestSsl();
          } else {
            con.startup(self.getStartupConf());
          }
        });
        con.on("sslconnect", function() {
          con.startup(self.getStartupConf());
        });
        this._attachListeners(con);
        con.once("end", () => {
          const error = this._ending ? new Error("Connection terminated") : new Error("Connection terminated unexpectedly");
          clearTimeout(this.connectionTimeoutHandle);
          this._errorAllQueries(error);
          this._ended = true;
          if (!this._ending) {
            if (this._connecting && !this._connectionError) {
              if (this._connectionCallback) {
                this._connectionCallback(error);
              } else {
                this._handleErrorEvent(error);
              }
            } else if (!this._connectionError) {
              this._handleErrorEvent(error);
            }
          }
          process.nextTick(() => {
            this.emit("end");
          });
        });
      }
      connect(callback) {
        if (callback) {
          this._connect(callback);
          return;
        }
        return new this._Promise((resolve, reject) => {
          this._connect((error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
      }
      _attachListeners(con) {
        con.on("authenticationCleartextPassword", this._handleAuthCleartextPassword.bind(this));
        con.on("authenticationMD5Password", this._handleAuthMD5Password.bind(this));
        con.on("authenticationSASL", this._handleAuthSASL.bind(this));
        con.on("authenticationSASLContinue", this._handleAuthSASLContinue.bind(this));
        con.on("authenticationSASLFinal", this._handleAuthSASLFinal.bind(this));
        con.on("backendKeyData", this._handleBackendKeyData.bind(this));
        con.on("error", this._handleErrorEvent.bind(this));
        con.on("errorMessage", this._handleErrorMessage.bind(this));
        con.on("readyForQuery", this._handleReadyForQuery.bind(this));
        con.on("notice", this._handleNotice.bind(this));
        con.on("rowDescription", this._handleRowDescription.bind(this));
        con.on("dataRow", this._handleDataRow.bind(this));
        con.on("portalSuspended", this._handlePortalSuspended.bind(this));
        con.on("emptyQuery", this._handleEmptyQuery.bind(this));
        con.on("commandComplete", this._handleCommandComplete.bind(this));
        con.on("parseComplete", this._handleParseComplete.bind(this));
        con.on("copyInResponse", this._handleCopyInResponse.bind(this));
        con.on("copyData", this._handleCopyData.bind(this));
        con.on("notification", this._handleNotification.bind(this));
      }
      // TODO(bmc): deprecate pgpass "built in" integration since this.password can be a function
      // it can be supplied by the user if required - this is a breaking change!
      _checkPgPass(cb) {
        const con = this.connection;
        if (typeof this.password === "function") {
          this._Promise.resolve().then(() => this.password()).then((pass) => {
            if (pass !== void 0) {
              if (typeof pass !== "string") {
                con.emit("error", new TypeError("Password must be a string"));
                return;
              }
              this.connectionParameters.password = this.password = pass;
            } else {
              this.connectionParameters.password = this.password = null;
            }
            cb();
          }).catch((err) => {
            con.emit("error", err);
          });
        } else if (this.password !== null) {
          cb();
        } else {
          try {
            const pgPass = require_lib();
            pgPass(this.connectionParameters, (pass) => {
              if (void 0 !== pass) {
                this.connectionParameters.password = this.password = pass;
              }
              cb();
            });
          } catch (e) {
            this.emit("error", e);
          }
        }
      }
      _handleAuthCleartextPassword(msg) {
        this._checkPgPass(() => {
          this.connection.password(this.password);
        });
      }
      _handleAuthMD5Password(msg) {
        this._checkPgPass(async () => {
          try {
            const hashedPassword = await crypto2.postgresMd5PasswordHash(this.user, this.password, msg.salt);
            this.connection.password(hashedPassword);
          } catch (e) {
            this.emit("error", e);
          }
        });
      }
      _handleAuthSASL(msg) {
        this._checkPgPass(() => {
          try {
            this.saslSession = sasl.startSession(msg.mechanisms, this.enableChannelBinding && this.connection.stream);
            this.connection.sendSASLInitialResponseMessage(this.saslSession.mechanism, this.saslSession.response);
          } catch (err) {
            this.connection.emit("error", err);
          }
        });
      }
      async _handleAuthSASLContinue(msg) {
        try {
          await sasl.continueSession(
            this.saslSession,
            this.password,
            msg.data,
            this.enableChannelBinding && this.connection.stream
          );
          this.connection.sendSCRAMClientFinalMessage(this.saslSession.response);
        } catch (err) {
          this.connection.emit("error", err);
        }
      }
      _handleAuthSASLFinal(msg) {
        try {
          sasl.finalizeSession(this.saslSession, msg.data);
          this.saslSession = null;
        } catch (err) {
          this.connection.emit("error", err);
        }
      }
      _handleBackendKeyData(msg) {
        this.processID = msg.processID;
        this.secretKey = msg.secretKey;
      }
      _handleReadyForQuery(msg) {
        if (this._connecting) {
          this._connecting = false;
          this._connected = true;
          clearTimeout(this.connectionTimeoutHandle);
          if (this._connectionCallback) {
            this._connectionCallback(null, this);
            this._connectionCallback = null;
          }
          this.emit("connect");
        }
        const { activeQuery } = this;
        this.activeQuery = null;
        this.readyForQuery = true;
        if (activeQuery) {
          activeQuery.handleReadyForQuery(this.connection);
        }
        this._pulseQueryQueue();
      }
      // if we receive an error event or error message
      // during the connection process we handle it here
      _handleErrorWhileConnecting(err) {
        if (this._connectionError) {
          return;
        }
        this._connectionError = true;
        clearTimeout(this.connectionTimeoutHandle);
        if (this._connectionCallback) {
          return this._connectionCallback(err);
        }
        this.emit("error", err);
      }
      // if we're connected and we receive an error event from the connection
      // this means the socket is dead - do a hard abort of all queries and emit
      // the socket error on the client as well
      _handleErrorEvent(err) {
        if (this._connecting) {
          return this._handleErrorWhileConnecting(err);
        }
        this._queryable = false;
        this._errorAllQueries(err);
        this.emit("error", err);
      }
      // handle error messages from the postgres backend
      _handleErrorMessage(msg) {
        if (this._connecting) {
          return this._handleErrorWhileConnecting(msg);
        }
        const activeQuery = this.activeQuery;
        if (!activeQuery) {
          this._handleErrorEvent(msg);
          return;
        }
        this.activeQuery = null;
        activeQuery.handleError(msg, this.connection);
      }
      _handleRowDescription(msg) {
        this.activeQuery.handleRowDescription(msg);
      }
      _handleDataRow(msg) {
        this.activeQuery.handleDataRow(msg);
      }
      _handlePortalSuspended(msg) {
        this.activeQuery.handlePortalSuspended(this.connection);
      }
      _handleEmptyQuery(msg) {
        this.activeQuery.handleEmptyQuery(this.connection);
      }
      _handleCommandComplete(msg) {
        if (this.activeQuery == null) {
          const error = new Error("Received unexpected commandComplete message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        this.activeQuery.handleCommandComplete(msg, this.connection);
      }
      _handleParseComplete() {
        if (this.activeQuery == null) {
          const error = new Error("Received unexpected parseComplete message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        if (this.activeQuery.name) {
          this.connection.parsedStatements[this.activeQuery.name] = this.activeQuery.text;
        }
      }
      _handleCopyInResponse(msg) {
        this.activeQuery.handleCopyInResponse(this.connection);
      }
      _handleCopyData(msg) {
        this.activeQuery.handleCopyData(msg, this.connection);
      }
      _handleNotification(msg) {
        this.emit("notification", msg);
      }
      _handleNotice(msg) {
        this.emit("notice", msg);
      }
      getStartupConf() {
        const params = this.connectionParameters;
        const data = {
          user: params.user,
          database: params.database
        };
        const appName = params.application_name || params.fallback_application_name;
        if (appName) {
          data.application_name = appName;
        }
        if (params.replication) {
          data.replication = "" + params.replication;
        }
        if (params.statement_timeout) {
          data.statement_timeout = String(parseInt(params.statement_timeout, 10));
        }
        if (params.lock_timeout) {
          data.lock_timeout = String(parseInt(params.lock_timeout, 10));
        }
        if (params.idle_in_transaction_session_timeout) {
          data.idle_in_transaction_session_timeout = String(parseInt(params.idle_in_transaction_session_timeout, 10));
        }
        if (params.options) {
          data.options = params.options;
        }
        return data;
      }
      cancel(client, query) {
        if (client.activeQuery === query) {
          const con = this.connection;
          if (this.host && this.host.indexOf("/") === 0) {
            con.connect(this.host + "/.s.PGSQL." + this.port);
          } else {
            con.connect(this.port, this.host);
          }
          con.on("connect", function() {
            con.cancel(client.processID, client.secretKey);
          });
        } else if (client.queryQueue.indexOf(query) !== -1) {
          client.queryQueue.splice(client.queryQueue.indexOf(query), 1);
        }
      }
      setTypeParser(oid, format, parseFn) {
        return this._types.setTypeParser(oid, format, parseFn);
      }
      getTypeParser(oid, format) {
        return this._types.getTypeParser(oid, format);
      }
      // escapeIdentifier and escapeLiteral moved to utility functions & exported
      // on PG
      // re-exported here for backwards compatibility
      escapeIdentifier(str2) {
        return utils.escapeIdentifier(str2);
      }
      escapeLiteral(str2) {
        return utils.escapeLiteral(str2);
      }
      _pulseQueryQueue() {
        if (this.readyForQuery === true) {
          this.activeQuery = this.queryQueue.shift();
          if (this.activeQuery) {
            this.readyForQuery = false;
            this.hasExecuted = true;
            const queryError = this.activeQuery.submit(this.connection);
            if (queryError) {
              process.nextTick(() => {
                this.activeQuery.handleError(queryError, this.connection);
                this.readyForQuery = true;
                this._pulseQueryQueue();
              });
            }
          } else if (this.hasExecuted) {
            this.activeQuery = null;
            this.emit("drain");
          }
        }
      }
      query(config, values, callback) {
        let query;
        let result;
        let readTimeout;
        let readTimeoutTimer;
        let queryCallback;
        if (config === null || config === void 0) {
          throw new TypeError("Client was passed a null or undefined query");
        } else if (typeof config.submit === "function") {
          readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
          result = query = config;
          if (typeof values === "function") {
            query.callback = query.callback || values;
          }
        } else {
          readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
          query = new Query2(config, values, callback);
          if (!query.callback) {
            result = new this._Promise((resolve, reject) => {
              query.callback = (err, res) => err ? reject(err) : resolve(res);
            }).catch((err) => {
              Error.captureStackTrace(err);
              throw err;
            });
          }
        }
        if (readTimeout) {
          queryCallback = query.callback;
          readTimeoutTimer = setTimeout(() => {
            const error = new Error("Query read timeout");
            process.nextTick(() => {
              query.handleError(error, this.connection);
            });
            queryCallback(error);
            query.callback = () => {
            };
            const index = this.queryQueue.indexOf(query);
            if (index > -1) {
              this.queryQueue.splice(index, 1);
            }
            this._pulseQueryQueue();
          }, readTimeout);
          query.callback = (err, res) => {
            clearTimeout(readTimeoutTimer);
            queryCallback(err, res);
          };
        }
        if (this.binary && !query.binary) {
          query.binary = true;
        }
        if (query._result && !query._result._types) {
          query._result._types = this._types;
        }
        if (!this._queryable) {
          process.nextTick(() => {
            query.handleError(new Error("Client has encountered a connection error and is not queryable"), this.connection);
          });
          return result;
        }
        if (this._ending) {
          process.nextTick(() => {
            query.handleError(new Error("Client was closed and is not queryable"), this.connection);
          });
          return result;
        }
        this.queryQueue.push(query);
        this._pulseQueryQueue();
        return result;
      }
      ref() {
        this.connection.ref();
      }
      unref() {
        this.connection.unref();
      }
      end(cb) {
        this._ending = true;
        if (!this.connection._connecting || this._ended) {
          if (cb) {
            cb();
          } else {
            return this._Promise.resolve();
          }
        }
        if (this.activeQuery || !this._queryable) {
          this.connection.stream.destroy();
        } else {
          this.connection.end();
        }
        if (cb) {
          this.connection.once("end", cb);
        } else {
          return new this._Promise((resolve) => {
            this.connection.once("end", resolve);
          });
        }
      }
    };
    Client2.Query = Query2;
    module.exports = Client2;
  }
});

// node_modules/pg-pool/index.js
var require_pg_pool = __commonJS({
  "node_modules/pg-pool/index.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events").EventEmitter;
    var NOOP = function() {
    };
    var removeWhere = (list, predicate) => {
      const i = list.findIndex(predicate);
      return i === -1 ? void 0 : list.splice(i, 1)[0];
    };
    var IdleItem = class {
      constructor(client, idleListener, timeoutId) {
        this.client = client;
        this.idleListener = idleListener;
        this.timeoutId = timeoutId;
      }
    };
    var PendingItem = class {
      constructor(callback) {
        this.callback = callback;
      }
    };
    function throwOnDoubleRelease() {
      throw new Error("Release called on client which has already been released to the pool.");
    }
    function promisify(Promise2, callback) {
      if (callback) {
        return { callback, result: void 0 };
      }
      let rej;
      let res;
      const cb = function(err, client) {
        err ? rej(err) : res(client);
      };
      const result = new Promise2(function(resolve, reject) {
        res = resolve;
        rej = reject;
      }).catch((err) => {
        Error.captureStackTrace(err);
        throw err;
      });
      return { callback: cb, result };
    }
    function makeIdleListener(pool2, client) {
      return function idleListener(err) {
        err.client = client;
        client.removeListener("error", idleListener);
        client.on("error", () => {
          pool2.log("additional client error after disconnection due to error", err);
        });
        pool2._remove(client);
        pool2.emit("error", err, client);
      };
    }
    var Pool4 = class extends EventEmitter {
      constructor(options, Client2) {
        super();
        this.options = Object.assign({}, options);
        if (options != null && "password" in options) {
          Object.defineProperty(this.options, "password", {
            configurable: true,
            enumerable: false,
            writable: true,
            value: options.password
          });
        }
        if (options != null && options.ssl && options.ssl.key) {
          Object.defineProperty(this.options.ssl, "key", {
            enumerable: false
          });
        }
        this.options.max = this.options.max || this.options.poolSize || 10;
        this.options.min = this.options.min || 0;
        this.options.maxUses = this.options.maxUses || Infinity;
        this.options.allowExitOnIdle = this.options.allowExitOnIdle || false;
        this.options.maxLifetimeSeconds = this.options.maxLifetimeSeconds || 0;
        this.log = this.options.log || function() {
        };
        this.Client = this.options.Client || Client2 || require_lib2().Client;
        this.Promise = this.options.Promise || global.Promise;
        if (typeof this.options.idleTimeoutMillis === "undefined") {
          this.options.idleTimeoutMillis = 1e4;
        }
        this._clients = [];
        this._idle = [];
        this._expired = /* @__PURE__ */ new WeakSet();
        this._pendingQueue = [];
        this._endCallback = void 0;
        this.ending = false;
        this.ended = false;
      }
      _isFull() {
        return this._clients.length >= this.options.max;
      }
      _isAboveMin() {
        return this._clients.length > this.options.min;
      }
      _pulseQueue() {
        this.log("pulse queue");
        if (this.ended) {
          this.log("pulse queue ended");
          return;
        }
        if (this.ending) {
          this.log("pulse queue on ending");
          if (this._idle.length) {
            this._idle.slice().map((item) => {
              this._remove(item.client);
            });
          }
          if (!this._clients.length) {
            this.ended = true;
            this._endCallback();
          }
          return;
        }
        if (!this._pendingQueue.length) {
          this.log("no queued requests");
          return;
        }
        if (!this._idle.length && this._isFull()) {
          return;
        }
        const pendingItem = this._pendingQueue.shift();
        if (this._idle.length) {
          const idleItem = this._idle.pop();
          clearTimeout(idleItem.timeoutId);
          const client = idleItem.client;
          client.ref && client.ref();
          const idleListener = idleItem.idleListener;
          return this._acquireClient(client, pendingItem, idleListener, false);
        }
        if (!this._isFull()) {
          return this.newClient(pendingItem);
        }
        throw new Error("unexpected condition");
      }
      _remove(client, callback) {
        const removed = removeWhere(this._idle, (item) => item.client === client);
        if (removed !== void 0) {
          clearTimeout(removed.timeoutId);
        }
        this._clients = this._clients.filter((c) => c !== client);
        const context = this;
        client.end(() => {
          context.emit("remove", client);
          if (typeof callback === "function") {
            callback();
          }
        });
      }
      connect(cb) {
        if (this.ending) {
          const err = new Error("Cannot use a pool after calling end on the pool");
          return cb ? cb(err) : this.Promise.reject(err);
        }
        const response = promisify(this.Promise, cb);
        const result = response.result;
        if (this._isFull() || this._idle.length) {
          if (this._idle.length) {
            process.nextTick(() => this._pulseQueue());
          }
          if (!this.options.connectionTimeoutMillis) {
            this._pendingQueue.push(new PendingItem(response.callback));
            return result;
          }
          const queueCallback = (err, res, done) => {
            clearTimeout(tid);
            response.callback(err, res, done);
          };
          const pendingItem = new PendingItem(queueCallback);
          const tid = setTimeout(() => {
            removeWhere(this._pendingQueue, (i) => i.callback === queueCallback);
            pendingItem.timedOut = true;
            response.callback(new Error("timeout exceeded when trying to connect"));
          }, this.options.connectionTimeoutMillis);
          if (tid.unref) {
            tid.unref();
          }
          this._pendingQueue.push(pendingItem);
          return result;
        }
        this.newClient(new PendingItem(response.callback));
        return result;
      }
      newClient(pendingItem) {
        const client = new this.Client(this.options);
        this._clients.push(client);
        const idleListener = makeIdleListener(this, client);
        this.log("checking client timeout");
        let tid;
        let timeoutHit = false;
        if (this.options.connectionTimeoutMillis) {
          tid = setTimeout(() => {
            this.log("ending client due to timeout");
            timeoutHit = true;
            client.connection ? client.connection.stream.destroy() : client.end();
          }, this.options.connectionTimeoutMillis);
        }
        this.log("connecting new client");
        client.connect((err) => {
          if (tid) {
            clearTimeout(tid);
          }
          client.on("error", idleListener);
          if (err) {
            this.log("client failed to connect", err);
            this._clients = this._clients.filter((c) => c !== client);
            if (timeoutHit) {
              err = new Error("Connection terminated due to connection timeout", { cause: err });
            }
            this._pulseQueue();
            if (!pendingItem.timedOut) {
              pendingItem.callback(err, void 0, NOOP);
            }
          } else {
            this.log("new client connected");
            if (this.options.maxLifetimeSeconds !== 0) {
              const maxLifetimeTimeout = setTimeout(() => {
                this.log("ending client due to expired lifetime");
                this._expired.add(client);
                const idleIndex = this._idle.findIndex((idleItem) => idleItem.client === client);
                if (idleIndex !== -1) {
                  this._acquireClient(
                    client,
                    new PendingItem((err2, client2, clientRelease) => clientRelease()),
                    idleListener,
                    false
                  );
                }
              }, this.options.maxLifetimeSeconds * 1e3);
              maxLifetimeTimeout.unref();
              client.once("end", () => clearTimeout(maxLifetimeTimeout));
            }
            return this._acquireClient(client, pendingItem, idleListener, true);
          }
        });
      }
      // acquire a client for a pending work item
      _acquireClient(client, pendingItem, idleListener, isNew) {
        if (isNew) {
          this.emit("connect", client);
        }
        this.emit("acquire", client);
        client.release = this._releaseOnce(client, idleListener);
        client.removeListener("error", idleListener);
        if (!pendingItem.timedOut) {
          if (isNew && this.options.verify) {
            this.options.verify(client, (err) => {
              if (err) {
                client.release(err);
                return pendingItem.callback(err, void 0, NOOP);
              }
              pendingItem.callback(void 0, client, client.release);
            });
          } else {
            pendingItem.callback(void 0, client, client.release);
          }
        } else {
          if (isNew && this.options.verify) {
            this.options.verify(client, client.release);
          } else {
            client.release();
          }
        }
      }
      // returns a function that wraps _release and throws if called more than once
      _releaseOnce(client, idleListener) {
        let released = false;
        return (err) => {
          if (released) {
            throwOnDoubleRelease();
          }
          released = true;
          this._release(client, idleListener, err);
        };
      }
      // release a client back to the poll, include an error
      // to remove it from the pool
      _release(client, idleListener, err) {
        client.on("error", idleListener);
        client._poolUseCount = (client._poolUseCount || 0) + 1;
        this.emit("release", err, client);
        if (err || this.ending || !client._queryable || client._ending || client._poolUseCount >= this.options.maxUses) {
          if (client._poolUseCount >= this.options.maxUses) {
            this.log("remove expended client");
          }
          return this._remove(client, this._pulseQueue.bind(this));
        }
        const isExpired = this._expired.has(client);
        if (isExpired) {
          this.log("remove expired client");
          this._expired.delete(client);
          return this._remove(client, this._pulseQueue.bind(this));
        }
        let tid;
        if (this.options.idleTimeoutMillis && this._isAboveMin()) {
          tid = setTimeout(() => {
            this.log("remove idle client");
            this._remove(client, this._pulseQueue.bind(this));
          }, this.options.idleTimeoutMillis);
          if (this.options.allowExitOnIdle) {
            tid.unref();
          }
        }
        if (this.options.allowExitOnIdle) {
          client.unref();
        }
        this._idle.push(new IdleItem(client, idleListener, tid));
        this._pulseQueue();
      }
      query(text2, values, cb) {
        if (typeof text2 === "function") {
          const response2 = promisify(this.Promise, text2);
          setImmediate(function() {
            return response2.callback(new Error("Passing a function as the first parameter to pool.query is not supported"));
          });
          return response2.result;
        }
        if (typeof values === "function") {
          cb = values;
          values = void 0;
        }
        const response = promisify(this.Promise, cb);
        cb = response.callback;
        this.connect((err, client) => {
          if (err) {
            return cb(err);
          }
          let clientReleased = false;
          const onError = (err2) => {
            if (clientReleased) {
              return;
            }
            clientReleased = true;
            client.release(err2);
            cb(err2);
          };
          client.once("error", onError);
          this.log("dispatching query");
          try {
            client.query(text2, values, (err2, res) => {
              this.log("query dispatched");
              client.removeListener("error", onError);
              if (clientReleased) {
                return;
              }
              clientReleased = true;
              client.release(err2);
              if (err2) {
                return cb(err2);
              }
              return cb(void 0, res);
            });
          } catch (err2) {
            client.release(err2);
            return cb(err2);
          }
        });
        return response.result;
      }
      end(cb) {
        this.log("ending");
        if (this.ending) {
          const err = new Error("Called end on pool more than once");
          return cb ? cb(err) : this.Promise.reject(err);
        }
        this.ending = true;
        const promised = promisify(this.Promise, cb);
        this._endCallback = promised.callback;
        this._pulseQueue();
        return promised.result;
      }
      get waitingCount() {
        return this._pendingQueue.length;
      }
      get idleCount() {
        return this._idle.length;
      }
      get expiredCount() {
        return this._clients.reduce((acc, client) => acc + (this._expired.has(client) ? 1 : 0), 0);
      }
      get totalCount() {
        return this._clients.length;
      }
    };
    module.exports = Pool4;
  }
});

// node_modules/pg/lib/native/query.js
var require_query2 = __commonJS({
  "node_modules/pg/lib/native/query.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events").EventEmitter;
    var util2 = __require("util");
    var utils = require_utils();
    var NativeQuery = module.exports = function(config, values, callback) {
      EventEmitter.call(this);
      config = utils.normalizeQueryConfig(config, values, callback);
      this.text = config.text;
      this.values = config.values;
      this.name = config.name;
      this.queryMode = config.queryMode;
      this.callback = config.callback;
      this.state = "new";
      this._arrayMode = config.rowMode === "array";
      this._emitRowEvents = false;
      this.on(
        "newListener",
        function(event) {
          if (event === "row") this._emitRowEvents = true;
        }.bind(this)
      );
    };
    util2.inherits(NativeQuery, EventEmitter);
    var errorFieldMap = {
      sqlState: "code",
      statementPosition: "position",
      messagePrimary: "message",
      context: "where",
      schemaName: "schema",
      tableName: "table",
      columnName: "column",
      dataTypeName: "dataType",
      constraintName: "constraint",
      sourceFile: "file",
      sourceLine: "line",
      sourceFunction: "routine"
    };
    NativeQuery.prototype.handleError = function(err) {
      const fields = this.native.pq.resultErrorFields();
      if (fields) {
        for (const key in fields) {
          const normalizedFieldName = errorFieldMap[key] || key;
          err[normalizedFieldName] = fields[key];
        }
      }
      if (this.callback) {
        this.callback(err);
      } else {
        this.emit("error", err);
      }
      this.state = "error";
    };
    NativeQuery.prototype.then = function(onSuccess, onFailure) {
      return this._getPromise().then(onSuccess, onFailure);
    };
    NativeQuery.prototype.catch = function(callback) {
      return this._getPromise().catch(callback);
    };
    NativeQuery.prototype._getPromise = function() {
      if (this._promise) return this._promise;
      this._promise = new Promise(
        function(resolve, reject) {
          this._once("end", resolve);
          this._once("error", reject);
        }.bind(this)
      );
      return this._promise;
    };
    NativeQuery.prototype.submit = function(client) {
      this.state = "running";
      const self = this;
      this.native = client.native;
      client.native.arrayMode = this._arrayMode;
      let after = function(err, rows, results) {
        client.native.arrayMode = false;
        setImmediate(function() {
          self.emit("_done");
        });
        if (err) {
          return self.handleError(err);
        }
        if (self._emitRowEvents) {
          if (results.length > 1) {
            rows.forEach((rowOfRows, i) => {
              rowOfRows.forEach((row) => {
                self.emit("row", row, results[i]);
              });
            });
          } else {
            rows.forEach(function(row) {
              self.emit("row", row, results);
            });
          }
        }
        self.state = "end";
        self.emit("end", results);
        if (self.callback) {
          self.callback(null, results);
        }
      };
      if (process.domain) {
        after = process.domain.bind(after);
      }
      if (this.name) {
        if (this.name.length > 63) {
          console.error("Warning! Postgres only supports 63 characters for query names.");
          console.error("You supplied %s (%s)", this.name, this.name.length);
          console.error("This can cause conflicts and silent errors executing queries");
        }
        const values = (this.values || []).map(utils.prepareValue);
        if (client.namedQueries[this.name]) {
          if (this.text && client.namedQueries[this.name] !== this.text) {
            const err = new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
            return after(err);
          }
          return client.native.execute(this.name, values, after);
        }
        return client.native.prepare(this.name, this.text, values.length, function(err) {
          if (err) return after(err);
          client.namedQueries[self.name] = self.text;
          return self.native.execute(self.name, values, after);
        });
      } else if (this.values) {
        if (!Array.isArray(this.values)) {
          const err = new Error("Query values must be an array");
          return after(err);
        }
        const vals = this.values.map(utils.prepareValue);
        client.native.query(this.text, vals, after);
      } else if (this.queryMode === "extended") {
        client.native.query(this.text, [], after);
      } else {
        client.native.query(this.text, after);
      }
    };
  }
});

// node_modules/pg/lib/native/client.js
var require_client2 = __commonJS({
  "node_modules/pg/lib/native/client.js"(exports, module) {
    "use strict";
    var Native;
    try {
      Native = __require("pg-native");
    } catch (e) {
      throw e;
    }
    var TypeOverrides2 = require_type_overrides();
    var EventEmitter = __require("events").EventEmitter;
    var util2 = __require("util");
    var ConnectionParameters = require_connection_parameters();
    var NativeQuery = require_query2();
    var Client2 = module.exports = function(config) {
      EventEmitter.call(this);
      config = config || {};
      this._Promise = config.Promise || global.Promise;
      this._types = new TypeOverrides2(config.types);
      this.native = new Native({
        types: this._types
      });
      this._queryQueue = [];
      this._ending = false;
      this._connecting = false;
      this._connected = false;
      this._queryable = true;
      const cp = this.connectionParameters = new ConnectionParameters(config);
      if (config.nativeConnectionString) cp.nativeConnectionString = config.nativeConnectionString;
      this.user = cp.user;
      Object.defineProperty(this, "password", {
        configurable: true,
        enumerable: false,
        writable: true,
        value: cp.password
      });
      this.database = cp.database;
      this.host = cp.host;
      this.port = cp.port;
      this.namedQueries = {};
    };
    Client2.Query = NativeQuery;
    util2.inherits(Client2, EventEmitter);
    Client2.prototype._errorAllQueries = function(err) {
      const enqueueError = (query) => {
        process.nextTick(() => {
          query.native = this.native;
          query.handleError(err);
        });
      };
      if (this._hasActiveQuery()) {
        enqueueError(this._activeQuery);
        this._activeQuery = null;
      }
      this._queryQueue.forEach(enqueueError);
      this._queryQueue.length = 0;
    };
    Client2.prototype._connect = function(cb) {
      const self = this;
      if (this._connecting) {
        process.nextTick(() => cb(new Error("Client has already been connected. You cannot reuse a client.")));
        return;
      }
      this._connecting = true;
      this.connectionParameters.getLibpqConnectionString(function(err, conString) {
        if (self.connectionParameters.nativeConnectionString) conString = self.connectionParameters.nativeConnectionString;
        if (err) return cb(err);
        self.native.connect(conString, function(err2) {
          if (err2) {
            self.native.end();
            return cb(err2);
          }
          self._connected = true;
          self.native.on("error", function(err3) {
            self._queryable = false;
            self._errorAllQueries(err3);
            self.emit("error", err3);
          });
          self.native.on("notification", function(msg) {
            self.emit("notification", {
              channel: msg.relname,
              payload: msg.extra
            });
          });
          self.emit("connect");
          self._pulseQueryQueue(true);
          cb();
        });
      });
    };
    Client2.prototype.connect = function(callback) {
      if (callback) {
        this._connect(callback);
        return;
      }
      return new this._Promise((resolve, reject) => {
        this._connect((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    };
    Client2.prototype.query = function(config, values, callback) {
      let query;
      let result;
      let readTimeout;
      let readTimeoutTimer;
      let queryCallback;
      if (config === null || config === void 0) {
        throw new TypeError("Client was passed a null or undefined query");
      } else if (typeof config.submit === "function") {
        readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
        result = query = config;
        if (typeof values === "function") {
          config.callback = values;
        }
      } else {
        readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
        query = new NativeQuery(config, values, callback);
        if (!query.callback) {
          let resolveOut, rejectOut;
          result = new this._Promise((resolve, reject) => {
            resolveOut = resolve;
            rejectOut = reject;
          }).catch((err) => {
            Error.captureStackTrace(err);
            throw err;
          });
          query.callback = (err, res) => err ? rejectOut(err) : resolveOut(res);
        }
      }
      if (readTimeout) {
        queryCallback = query.callback;
        readTimeoutTimer = setTimeout(() => {
          const error = new Error("Query read timeout");
          process.nextTick(() => {
            query.handleError(error, this.connection);
          });
          queryCallback(error);
          query.callback = () => {
          };
          const index = this._queryQueue.indexOf(query);
          if (index > -1) {
            this._queryQueue.splice(index, 1);
          }
          this._pulseQueryQueue();
        }, readTimeout);
        query.callback = (err, res) => {
          clearTimeout(readTimeoutTimer);
          queryCallback(err, res);
        };
      }
      if (!this._queryable) {
        query.native = this.native;
        process.nextTick(() => {
          query.handleError(new Error("Client has encountered a connection error and is not queryable"));
        });
        return result;
      }
      if (this._ending) {
        query.native = this.native;
        process.nextTick(() => {
          query.handleError(new Error("Client was closed and is not queryable"));
        });
        return result;
      }
      this._queryQueue.push(query);
      this._pulseQueryQueue();
      return result;
    };
    Client2.prototype.end = function(cb) {
      const self = this;
      this._ending = true;
      if (!this._connected) {
        this.once("connect", this.end.bind(this, cb));
      }
      let result;
      if (!cb) {
        result = new this._Promise(function(resolve, reject) {
          cb = (err) => err ? reject(err) : resolve();
        });
      }
      this.native.end(function() {
        self._errorAllQueries(new Error("Connection terminated"));
        process.nextTick(() => {
          self.emit("end");
          if (cb) cb();
        });
      });
      return result;
    };
    Client2.prototype._hasActiveQuery = function() {
      return this._activeQuery && this._activeQuery.state !== "error" && this._activeQuery.state !== "end";
    };
    Client2.prototype._pulseQueryQueue = function(initialConnection) {
      if (!this._connected) {
        return;
      }
      if (this._hasActiveQuery()) {
        return;
      }
      const query = this._queryQueue.shift();
      if (!query) {
        if (!initialConnection) {
          this.emit("drain");
        }
        return;
      }
      this._activeQuery = query;
      query.submit(this);
      const self = this;
      query.once("_done", function() {
        self._pulseQueryQueue();
      });
    };
    Client2.prototype.cancel = function(query) {
      if (this._activeQuery === query) {
        this.native.cancel(function() {
        });
      } else if (this._queryQueue.indexOf(query) !== -1) {
        this._queryQueue.splice(this._queryQueue.indexOf(query), 1);
      }
    };
    Client2.prototype.ref = function() {
    };
    Client2.prototype.unref = function() {
    };
    Client2.prototype.setTypeParser = function(oid, format, parseFn) {
      return this._types.setTypeParser(oid, format, parseFn);
    };
    Client2.prototype.getTypeParser = function(oid, format) {
      return this._types.getTypeParser(oid, format);
    };
  }
});

// node_modules/pg/lib/native/index.js
var require_native = __commonJS({
  "node_modules/pg/lib/native/index.js"(exports, module) {
    "use strict";
    module.exports = require_client2();
  }
});

// node_modules/pg/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/pg/lib/index.js"(exports, module) {
    "use strict";
    var Client2 = require_client();
    var defaults3 = require_defaults();
    var Connection2 = require_connection();
    var Result2 = require_result();
    var utils = require_utils();
    var Pool4 = require_pg_pool();
    var TypeOverrides2 = require_type_overrides();
    var { DatabaseError: DatabaseError2 } = require_dist();
    var { escapeIdentifier: escapeIdentifier2, escapeLiteral: escapeLiteral2 } = require_utils();
    var poolFactory = (Client3) => {
      return class BoundPool extends Pool4 {
        constructor(options) {
          super(options, Client3);
        }
      };
    };
    var PG = function(clientConstructor) {
      this.defaults = defaults3;
      this.Client = clientConstructor;
      this.Query = this.Client.Query;
      this.Pool = poolFactory(this.Client);
      this._pools = [];
      this.Connection = Connection2;
      this.types = require_pg_types();
      this.DatabaseError = DatabaseError2;
      this.TypeOverrides = TypeOverrides2;
      this.escapeIdentifier = escapeIdentifier2;
      this.escapeLiteral = escapeLiteral2;
      this.Result = Result2;
      this.utils = utils;
    };
    if (typeof process.env.NODE_PG_FORCE_NATIVE !== "undefined") {
      module.exports = new PG(require_native());
    } else {
      module.exports = new PG(Client2);
      Object.defineProperty(module.exports, "native", {
        configurable: true,
        enumerable: false,
        get() {
          let native = null;
          try {
            native = new PG(require_native());
          } catch (err) {
            if (err.code !== "MODULE_NOT_FOUND") {
              throw err;
            }
          }
          Object.defineProperty(module.exports, "native", {
            value: native
          });
          return native;
        }
      });
    }
  }
});

// node_modules/dotenv/config.js
(function() {
  require_main().config(
    Object.assign(
      {},
      require_env_options(),
      require_cli_options()(process.argv)
    )
  );
})();

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  analyticsSnapshots: () => analyticsSnapshots,
  articles: () => articles,
  ciBriefScripts: () => ciBriefScripts,
  ciCompetitors: () => ciCompetitors,
  ciContentBriefs: () => ciContentBriefs,
  ciPerformanceReports: () => ciPerformanceReports,
  ciScrapedVideos: () => ciScrapedVideos,
  ciSettings: () => ciSettings,
  ciVideoAnalyses: () => ciVideoAnalyses,
  contentSuggestions: () => contentSuggestions,
  conversations: () => conversations,
  horoscopeEntries: () => horoscopeEntries,
  horoscopePrompts: () => horoscopePrompts,
  imageStyles: () => imageStyles,
  insertAnalyticsSnapshotSchema: () => insertAnalyticsSnapshotSchema,
  insertArticleSchema: () => insertArticleSchema,
  insertCiBriefScriptSchema: () => insertCiBriefScriptSchema,
  insertCiCompetitorSchema: () => insertCiCompetitorSchema,
  insertCiContentBriefSchema: () => insertCiContentBriefSchema,
  insertCiPerformanceReportSchema: () => insertCiPerformanceReportSchema,
  insertCiScrapedVideoSchema: () => insertCiScrapedVideoSchema,
  insertCiSettingSchema: () => insertCiSettingSchema,
  insertCiVideoAnalysisSchema: () => insertCiVideoAnalysisSchema,
  insertContentSuggestionSchema: () => insertContentSuggestionSchema,
  insertConversationSchema: () => insertConversationSchema,
  insertHoroscopeEntrySchema: () => insertHoroscopeEntrySchema,
  insertHoroscopePromptSchema: () => insertHoroscopePromptSchema,
  insertImageStyleSchema: () => insertImageStyleSchema,
  insertIntegrationSchema: () => insertIntegrationSchema,
  insertKeywordSchema: () => insertKeywordSchema,
  insertLinkTableColumnSchema: () => insertLinkTableColumnSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertOptimizationAnalysisSchema: () => insertOptimizationAnalysisSchema,
  insertOptimizationPromptSchema: () => insertOptimizationPromptSchema,
  insertPsychicSchema: () => insertPsychicSchema,
  insertSeoSettingsSchema: () => insertSeoSettingsSchema,
  insertSiteUrlSchema: () => insertSiteUrlSchema,
  insertSocialCarouselTypeSchema: () => insertSocialCarouselTypeSchema,
  insertSocialMediaLibrarySchema: () => insertSocialMediaLibrarySchema,
  insertSocialPostSchema: () => insertSocialPostSchema,
  insertSocialPostSlideSchema: () => insertSocialPostSlideSchema,
  insertSocialSlideTemplateSchema: () => insertSocialSlideTemplateSchema,
  insertSocialTemplateSetSchema: () => insertSocialTemplateSetSchema,
  insertTargetAudienceSchema: () => insertTargetAudienceSchema,
  insertUserSchema: () => insertUserSchema,
  insertVideoCaptionPromptSchema: () => insertVideoCaptionPromptSchema,
  insertVideoCaptionSchema: () => insertVideoCaptionSchema,
  insertVideoMessageSchema: () => insertVideoMessageSchema,
  insertVideoRequestSchema: () => insertVideoRequestSchema,
  insertVspBulkGenerationJobSchema: () => insertVspBulkGenerationJobSchema,
  insertVspCampaignSchema: () => insertVspCampaignSchema,
  insertVspCampaignTemplateSchema: () => insertVspCampaignTemplateSchema,
  insertVspCaptionStyleSchema: () => insertVspCaptionStyleSchema,
  insertVspContentCalendarSchema: () => insertVspContentCalendarSchema,
  insertVspContentCategorySchema: () => insertVspContentCategorySchema,
  insertVspContentProjectSchema: () => insertVspContentProjectSchema,
  insertVspContentSubtopicSchema: () => insertVspContentSubtopicSchema,
  insertVspContentTemplateSchema: () => insertVspContentTemplateSchema,
  insertVspScriptStyleSchema: () => insertVspScriptStyleSchema,
  insertWritingStyleSchema: () => insertWritingStyleSchema,
  integrations: () => integrations,
  keywords: () => keywords,
  linkTableColumns: () => linkTableColumns,
  messages: () => messages,
  optimizationAnalyses: () => optimizationAnalyses,
  optimizationPrompts: () => optimizationPrompts,
  psychics: () => psychics,
  seoSettings: () => seoSettings,
  siteUrls: () => siteUrls,
  socialCarouselTypes: () => socialCarouselTypes,
  socialMediaLibrary: () => socialMediaLibrary,
  socialPostSlides: () => socialPostSlides,
  socialPosts: () => socialPosts,
  socialSlideTemplates: () => socialSlideTemplates,
  socialTemplateSets: () => socialTemplateSets,
  targetAudiences: () => targetAudiences,
  users: () => users,
  videoCaptionPrompts: () => videoCaptionPrompts,
  videoCaptions: () => videoCaptions,
  videoMessages: () => videoMessages,
  videoRequests: () => videoRequests,
  vspBulkGenerationJobs: () => vspBulkGenerationJobs,
  vspCampaignTemplates: () => vspCampaignTemplates,
  vspCampaigns: () => vspCampaigns,
  vspCaptionGenerationSchema: () => vspCaptionGenerationSchema,
  vspCaptionStyles: () => vspCaptionStyles,
  vspContentCalendar: () => vspContentCalendar,
  vspContentCategories: () => vspContentCategories,
  vspContentProjects: () => vspContentProjects,
  vspContentSubtopics: () => vspContentSubtopics,
  vspContentTemplates: () => vspContentTemplates,
  vspPublishToPostBridgeSchema: () => vspPublishToPostBridgeSchema,
  vspScriptGenerationSchema: () => vspScriptGenerationSchema,
  vspScriptStyles: () => vspScriptStyles,
  vspVideoGenerationSchema: () => vspVideoGenerationSchema,
  writingStyles: () => writingStyles
});

// node_modules/drizzle-orm/entity.js
var entityKind = Symbol.for("drizzle:entityKind");
var hasOwnEntityKind = Symbol.for("drizzle:hasOwnEntityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(
      `Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`
    );
  }
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}

// node_modules/drizzle-orm/column.js
var Column = class {
  constructor(table, config) {
    this.table = table;
    this.config = config;
    this.name = config.name;
    this.keyAsName = config.keyAsName;
    this.notNull = config.notNull;
    this.default = config.default;
    this.defaultFn = config.defaultFn;
    this.onUpdateFn = config.onUpdateFn;
    this.hasDefault = config.hasDefault;
    this.primary = config.primaryKey;
    this.isUnique = config.isUnique;
    this.uniqueName = config.uniqueName;
    this.uniqueType = config.uniqueType;
    this.dataType = config.dataType;
    this.columnType = config.columnType;
    this.generated = config.generated;
    this.generatedIdentity = config.generatedIdentity;
  }
  static [entityKind] = "Column";
  name;
  keyAsName;
  primary;
  notNull;
  default;
  defaultFn;
  onUpdateFn;
  hasDefault;
  isUnique;
  uniqueName;
  uniqueType;
  dataType;
  columnType;
  enumValues = void 0;
  generated = void 0;
  generatedIdentity = void 0;
  config;
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
  // ** @internal */
  shouldDisableInsert() {
    return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
  }
};

// node_modules/drizzle-orm/column-builder.js
var ColumnBuilder = class {
  static [entityKind] = "ColumnBuilder";
  config;
  constructor(name, dataType, columnType) {
    this.config = {
      name,
      keyAsName: name === "",
      notNull: false,
      default: void 0,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: void 0,
      uniqueType: void 0,
      dataType,
      columnType,
      generated: void 0
    };
  }
  /**
   * Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
   *
   * @example
   * ```ts
   * const users = pgTable('users', {
   * 	id: integer('id').$type<UserId>().primaryKey(),
   * 	details: json('details').$type<UserDetails>().notNull(),
   * });
   * ```
   */
  $type() {
    return this;
  }
  /**
   * Adds a `not null` clause to the column definition.
   *
   * Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
   */
  notNull() {
    this.config.notNull = true;
    return this;
  }
  /**
   * Adds a `default <value>` clause to the column definition.
   *
   * Affects the `insert` model of the table - columns *with* `default` are optional on insert.
   *
   * If you need to set a dynamic default value, use {@link $defaultFn} instead.
   */
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Adds a dynamic default value to the column.
   * The function will be called when the row is inserted, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $defaultFn(fn) {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $defaultFn}.
   */
  $default = this.$defaultFn;
  /**
   * Adds a dynamic update value to the column.
   * The function will be called when the row is updated, and the returned value will be used as the column value if none is provided.
   * If no `default` (or `$defaultFn`) value is provided, the function will be called when the row is inserted as well, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $onUpdateFn(fn) {
    this.config.onUpdateFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $onUpdateFn}.
   */
  $onUpdate = this.$onUpdateFn;
  /**
   * Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
   *
   * In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
   */
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
  /** @internal Sets the name of the column to the key within the table definition if a name was not given. */
  setName(name) {
    if (this.config.name !== "")
      return;
    this.config.name = name;
  }
};

// node_modules/drizzle-orm/table.utils.js
var TableName = Symbol.for("drizzle:Name");

// node_modules/drizzle-orm/pg-core/foreign-keys.js
var ForeignKeyBuilder = class {
  static [entityKind] = "PgForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate = "no action";
  /** @internal */
  _onDelete = "no action";
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action === void 0 ? "no action" : action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action === void 0 ? "no action" : action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey(table, this);
  }
};
var ForeignKey = class {
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "PgForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
};

// node_modules/drizzle-orm/tracing-utils.js
function iife(fn, ...args) {
  return fn(...args);
}

// node_modules/drizzle-orm/pg-core/unique-constraint.js
function uniqueKeyName(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
var UniqueConstraintBuilder = class {
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entityKind] = "PgUniqueConstraintBuilder";
  /** @internal */
  columns;
  /** @internal */
  nullsNotDistinctConfig = false;
  nullsNotDistinct() {
    this.nullsNotDistinctConfig = true;
    return this;
  }
  /** @internal */
  build(table) {
    return new UniqueConstraint(table, this.columns, this.nullsNotDistinctConfig, this.name);
  }
};
var UniqueOnConstraintBuilder = class {
  static [entityKind] = "PgUniqueOnConstraintBuilder";
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder(columns, this.name);
  }
};
var UniqueConstraint = class {
  constructor(table, columns, nullsNotDistinct, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName(this.table, this.columns.map((column) => column.name));
    this.nullsNotDistinct = nullsNotDistinct;
  }
  static [entityKind] = "PgUniqueConstraint";
  columns;
  name;
  nullsNotDistinct = false;
  getName() {
    return this.name;
  }
};

// node_modules/drizzle-orm/pg-core/utils/array.js
function parsePgArrayValue(arrayString, startFrom, inQuotes) {
  for (let i = startFrom; i < arrayString.length; i++) {
    const char2 = arrayString[i];
    if (char2 === "\\") {
      i++;
      continue;
    }
    if (char2 === '"') {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i + 1];
    }
    if (inQuotes) {
      continue;
    }
    if (char2 === "," || char2 === "}") {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i];
    }
  }
  return [arrayString.slice(startFrom).replace(/\\/g, ""), arrayString.length];
}
function parsePgNestedArray(arrayString, startFrom = 0) {
  const result = [];
  let i = startFrom;
  let lastCharIsComma = false;
  while (i < arrayString.length) {
    const char2 = arrayString[i];
    if (char2 === ",") {
      if (lastCharIsComma || i === startFrom) {
        result.push("");
      }
      lastCharIsComma = true;
      i++;
      continue;
    }
    lastCharIsComma = false;
    if (char2 === "\\") {
      i += 2;
      continue;
    }
    if (char2 === '"') {
      const [value2, startFrom2] = parsePgArrayValue(arrayString, i + 1, true);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    if (char2 === "}") {
      return [result, i + 1];
    }
    if (char2 === "{") {
      const [value2, startFrom2] = parsePgNestedArray(arrayString, i + 1);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    const [value, newStartFrom] = parsePgArrayValue(arrayString, i, false);
    result.push(value);
    i = newStartFrom;
  }
  return [result, i];
}
function parsePgArray(arrayString) {
  const [result] = parsePgNestedArray(arrayString, 1);
  return result;
}
function makePgArray(array) {
  return `{${array.map((item) => {
    if (Array.isArray(item)) {
      return makePgArray(item);
    }
    if (typeof item === "string") {
      return `"${item.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return `${item}`;
  }).join(",")}}`;
}

// node_modules/drizzle-orm/pg-core/columns/common.js
var PgColumnBuilder = class extends ColumnBuilder {
  foreignKeyConfigs = [];
  static [entityKind] = "PgColumnBuilder";
  array(size) {
    return new PgArrayBuilder(this.config.name, this, size);
  }
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name, config) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    this.config.uniqueType = config?.nulls;
    return this;
  }
  generatedAlwaysAs(as) {
    this.config.generated = {
      as,
      type: "always",
      mode: "stored"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return iife(
        (ref2, actions2) => {
          const builder = new ForeignKeyBuilder(() => {
            const foreignColumn = ref2();
            return { columns: [column], foreignColumns: [foreignColumn] };
          });
          if (actions2.onUpdate) {
            builder.onUpdate(actions2.onUpdate);
          }
          if (actions2.onDelete) {
            builder.onDelete(actions2.onDelete);
          }
          return builder.build(table);
        },
        ref,
        actions
      );
    });
  }
  /** @internal */
  buildExtraConfigColumn(table) {
    return new ExtraConfigColumn(table, this.config);
  }
};
var PgColumn = class extends Column {
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "PgColumn";
};
var ExtraConfigColumn = class extends PgColumn {
  static [entityKind] = "ExtraConfigColumn";
  getSQLType() {
    return this.getSQLType();
  }
  indexConfig = {
    order: this.config.order ?? "asc",
    nulls: this.config.nulls ?? "last",
    opClass: this.config.opClass
  };
  defaultConfig = {
    order: "asc",
    nulls: "last",
    opClass: void 0
  };
  asc() {
    this.indexConfig.order = "asc";
    return this;
  }
  desc() {
    this.indexConfig.order = "desc";
    return this;
  }
  nullsFirst() {
    this.indexConfig.nulls = "first";
    return this;
  }
  nullsLast() {
    this.indexConfig.nulls = "last";
    return this;
  }
  /**
   * ### PostgreSQL documentation quote
   *
   * > An operator class with optional parameters can be specified for each column of an index.
   * The operator class identifies the operators to be used by the index for that column.
   * For example, a B-tree index on four-byte integers would use the int4_ops class;
   * this operator class includes comparison functions for four-byte integers.
   * In practice the default operator class for the column's data type is usually sufficient.
   * The main point of having operator classes is that for some data types, there could be more than one meaningful ordering.
   * For example, we might want to sort a complex-number data type either by absolute value or by real part.
   * We could do this by defining two operator classes for the data type and then selecting the proper class when creating an index.
   * More information about operator classes check:
   *
   * ### Useful links
   * https://www.postgresql.org/docs/current/sql-createindex.html
   *
   * https://www.postgresql.org/docs/current/indexes-opclass.html
   *
   * https://www.postgresql.org/docs/current/xindex.html
   *
   * ### Additional types
   * If you have the `pg_vector` extension installed in your database, you can use the
   * `vector_l2_ops`, `vector_ip_ops`, `vector_cosine_ops`, `vector_l1_ops`, `bit_hamming_ops`, `bit_jaccard_ops`, `halfvec_l2_ops`, `sparsevec_l2_ops` options, which are predefined types.
   *
   * **You can always specify any string you want in the operator class, in case Drizzle doesn't have it natively in its types**
   *
   * @param opClass
   * @returns
   */
  op(opClass) {
    this.indexConfig.opClass = opClass;
    return this;
  }
};
var IndexedColumn = class {
  static [entityKind] = "IndexedColumn";
  constructor(name, keyAsName, type, indexConfig) {
    this.name = name;
    this.keyAsName = keyAsName;
    this.type = type;
    this.indexConfig = indexConfig;
  }
  name;
  keyAsName;
  type;
  indexConfig;
};
var PgArrayBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgArrayBuilder";
  constructor(name, baseBuilder, size) {
    super(name, "array", "PgArray");
    this.config.baseBuilder = baseBuilder;
    this.config.size = size;
  }
  /** @internal */
  build(table) {
    const baseColumn = this.config.baseBuilder.build(table);
    return new PgArray(
      table,
      this.config,
      baseColumn
    );
  }
};
var PgArray = class _PgArray extends PgColumn {
  constructor(table, config, baseColumn, range) {
    super(table, config);
    this.baseColumn = baseColumn;
    this.range = range;
    this.size = config.size;
  }
  size;
  static [entityKind] = "PgArray";
  getSQLType() {
    return `${this.baseColumn.getSQLType()}[${typeof this.size === "number" ? this.size : ""}]`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      value = parsePgArray(value);
    }
    return value.map((v) => this.baseColumn.mapFromDriverValue(v));
  }
  mapToDriverValue(value, isNestedArray = false) {
    const a = value.map(
      (v) => v === null ? null : is(this.baseColumn, _PgArray) ? this.baseColumn.mapToDriverValue(v, true) : this.baseColumn.mapToDriverValue(v)
    );
    if (isNestedArray)
      return a;
    return makePgArray(a);
  }
};

// node_modules/drizzle-orm/pg-core/columns/enum.js
var isPgEnumSym = Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}
var PgEnumColumnBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgEnumColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumColumn(
      table,
      this.config
    );
  }
};
var PgEnumColumn = class extends PgColumn {
  static [entityKind] = "PgEnumColumn";
  enum = this.config.enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};

// node_modules/drizzle-orm/subquery.js
var Subquery = class {
  static [entityKind] = "Subquery";
  constructor(sql2, selection, alias, isWith = false) {
    this._ = {
      brand: "Subquery",
      sql: sql2,
      selectedFields: selection,
      alias,
      isWith
    };
  }
  // getSQL(): SQL<unknown> {
  // 	return new SQL([this]);
  // }
};
var WithSubquery = class extends Subquery {
  static [entityKind] = "WithSubquery";
};

// node_modules/drizzle-orm/version.js
var version = "0.39.3";

// node_modules/drizzle-orm/tracing.js
var otel;
var rawTracer;
var tracer = {
  startActiveSpan(name, fn) {
    if (!otel) {
      return fn();
    }
    if (!rawTracer) {
      rawTracer = otel.trace.getTracer("drizzle-orm", version);
    }
    return iife(
      (otel2, rawTracer2) => rawTracer2.startActiveSpan(
        name,
        (span) => {
          try {
            return fn(span);
          } catch (e) {
            span.setStatus({
              code: otel2.SpanStatusCode.ERROR,
              message: e instanceof Error ? e.message : "Unknown error"
              // eslint-disable-line no-instanceof/no-instanceof
            });
            throw e;
          } finally {
            span.end();
          }
        }
      ),
      otel,
      rawTracer
    );
  }
};

// node_modules/drizzle-orm/view-common.js
var ViewBaseConfig = Symbol.for("drizzle:ViewBaseConfig");

// node_modules/drizzle-orm/table.js
var Schema = Symbol.for("drizzle:Schema");
var Columns = Symbol.for("drizzle:Columns");
var ExtraConfigColumns = Symbol.for("drizzle:ExtraConfigColumns");
var OriginalName = Symbol.for("drizzle:OriginalName");
var BaseName = Symbol.for("drizzle:BaseName");
var IsAlias = Symbol.for("drizzle:IsAlias");
var ExtraConfigBuilder = Symbol.for("drizzle:ExtraConfigBuilder");
var IsDrizzleTable = Symbol.for("drizzle:IsDrizzleTable");
var Table = class {
  static [entityKind] = "Table";
  /** @internal */
  static Symbol = {
    Name: TableName,
    Schema,
    OriginalName,
    Columns,
    ExtraConfigColumns,
    BaseName,
    IsAlias,
    ExtraConfigBuilder
  };
  /**
   * @internal
   * Can be changed if the table is aliased.
   */
  [TableName];
  /**
   * @internal
   * Used to store the original name of the table, before any aliasing.
   */
  [OriginalName];
  /** @internal */
  [Schema];
  /** @internal */
  [Columns];
  /** @internal */
  [ExtraConfigColumns];
  /**
   *  @internal
   * Used to store the table name before the transformation via the `tableCreator` functions.
   */
  [BaseName];
  /** @internal */
  [IsAlias] = false;
  /** @internal */
  [IsDrizzleTable] = true;
  /** @internal */
  [ExtraConfigBuilder] = void 0;
  constructor(name, schema, baseName) {
    this[TableName] = this[OriginalName] = name;
    this[Schema] = schema;
    this[BaseName] = baseName;
  }
};
function isTable(table) {
  return typeof table === "object" && table !== null && IsDrizzleTable in table;
}
function getTableName(table) {
  return table[TableName];
}
function getTableUniqueName(table) {
  return `${table[Schema] ?? "public"}.${table[TableName]}`;
}

// node_modules/drizzle-orm/sql/sql.js
var FakePrimitiveParam = class {
  static [entityKind] = "FakePrimitiveParam";
};
function isSQLWrapper(value) {
  return value !== null && value !== void 0 && typeof value.getSQL === "function";
}
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}
var StringChunk = class {
  static [entityKind] = "StringChunk";
  value;
  constructor(value) {
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
};
var SQL = class _SQL {
  constructor(queryChunks) {
    this.queryChunks = queryChunks;
  }
  static [entityKind] = "SQL";
  /** @internal */
  decoder = noopDecoder;
  shouldInlineParams = false;
  append(query) {
    this.queryChunks.push(...query.queryChunks);
    return this;
  }
  toQuery(config) {
    return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
      const query = this.buildQueryFromSourceParams(this.queryChunks, config);
      span?.setAttributes({
        "drizzle.query.text": query.sql,
        "drizzle.query.params": JSON.stringify(query.params)
      });
      return query;
    });
  }
  buildQueryFromSourceParams(chunks, _config) {
    const config = Object.assign({}, _config, {
      inlineParams: _config.inlineParams || this.shouldInlineParams,
      paramStartIndex: _config.paramStartIndex || { value: 0 }
    });
    const {
      casing,
      escapeName,
      escapeParam,
      prepareTyping,
      inlineParams,
      paramStartIndex
    } = config;
    return mergeQueries(chunks.map((chunk) => {
      if (is(chunk, StringChunk)) {
        return { sql: chunk.value.join(""), params: [] };
      }
      if (is(chunk, Name)) {
        return { sql: escapeName(chunk.value), params: [] };
      }
      if (chunk === void 0) {
        return { sql: "", params: [] };
      }
      if (Array.isArray(chunk)) {
        const result = [new StringChunk("(")];
        for (const [i, p] of chunk.entries()) {
          result.push(p);
          if (i < chunk.length - 1) {
            result.push(new StringChunk(", "));
          }
        }
        result.push(new StringChunk(")"));
        return this.buildQueryFromSourceParams(result, config);
      }
      if (is(chunk, _SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        const tableName = chunk[Table.Symbol.Name];
        return {
          sql: schemaName === void 0 || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
          params: []
        };
      }
      if (is(chunk, Column)) {
        const columnName = casing.getColumnCasing(chunk);
        if (_config.invokeSource === "indexes") {
          return { sql: escapeName(columnName), params: [] };
        }
        const schemaName = chunk.table[Table.Symbol.Schema];
        return {
          sql: chunk.table[IsAlias] || schemaName === void 0 ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
          params: []
        };
      }
      if (is(chunk, View)) {
        const schemaName = chunk[ViewBaseConfig].schema;
        const viewName = chunk[ViewBaseConfig].name;
        return {
          sql: schemaName === void 0 || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if (is(chunk, Param)) {
        if (is(chunk.value, Placeholder)) {
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
        }
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if (is(mappedValue, _SQL)) {
          return this.buildQueryFromSourceParams([mappedValue], config);
        }
        if (inlineParams) {
          return { sql: this.mapInlineParam(mappedValue, config), params: [] };
        }
        let typings = ["none"];
        if (prepareTyping) {
          typings = [prepareTyping(chunk.encoder)];
        }
        return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
      }
      if (is(chunk, Placeholder)) {
        return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
      }
      if (is(chunk, _SQL.Aliased) && chunk.fieldAlias !== void 0) {
        return { sql: escapeName(chunk.fieldAlias), params: [] };
      }
      if (is(chunk, Subquery)) {
        if (chunk._.isWith) {
          return { sql: escapeName(chunk._.alias), params: [] };
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk._.sql,
          new StringChunk(") "),
          new Name(chunk._.alias)
        ], config);
      }
      if (isPgEnum(chunk)) {
        if (chunk.schema) {
          return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
        }
        return { sql: escapeName(chunk.enumName), params: [] };
      }
      if (isSQLWrapper(chunk)) {
        if (chunk.shouldOmitSQLParens?.()) {
          return this.buildQueryFromSourceParams([chunk.getSQL()], config);
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk.getSQL(),
          new StringChunk(")")
        ], config);
      }
      if (inlineParams) {
        return { sql: this.mapInlineParam(chunk, config), params: [] };
      }
      return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
    }));
  }
  mapInlineParam(chunk, { escapeString }) {
    if (chunk === null) {
      return "null";
    }
    if (typeof chunk === "number" || typeof chunk === "boolean") {
      return chunk.toString();
    }
    if (typeof chunk === "string") {
      return escapeString(chunk);
    }
    if (typeof chunk === "object") {
      const mappedValueAsString = chunk.toString();
      if (mappedValueAsString === "[object Object]") {
        return escapeString(JSON.stringify(chunk));
      }
      return escapeString(mappedValueAsString);
    }
    throw new Error("Unexpected param value: " + chunk);
  }
  getSQL() {
    return this;
  }
  as(alias) {
    if (alias === void 0) {
      return this;
    }
    return new _SQL.Aliased(this, alias);
  }
  mapWith(decoder) {
    this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
  /**
   * This method is used to conditionally include a part of the query.
   *
   * @param condition - Condition to check
   * @returns itself if the condition is `true`, otherwise `undefined`
   */
  if(condition) {
    return condition ? this : void 0;
  }
};
var Name = class {
  constructor(value) {
    this.value = value;
  }
  static [entityKind] = "Name";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
var noopDecoder = {
  mapFromDriverValue: (value) => value
};
var noopEncoder = {
  mapToDriverValue: (value) => value
};
var noopMapper = {
  ...noopDecoder,
  ...noopEncoder
};
var Param = class {
  /**
   * @param value - Parameter value
   * @param encoder - Encoder to convert the value to a driver parameter
   */
  constructor(value, encoder = noopEncoder) {
    this.value = value;
    this.encoder = encoder;
  }
  static [entityKind] = "Param";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
((sql2) => {
  function empty() {
    return new SQL([]);
  }
  sql2.empty = empty;
  function fromList(list) {
    return new SQL(list);
  }
  sql2.fromList = fromList;
  function raw(str2) {
    return new SQL([new StringChunk(str2)]);
  }
  sql2.raw = raw;
  function join(chunks, separator) {
    const result = [];
    for (const [i, chunk] of chunks.entries()) {
      if (i > 0 && separator !== void 0) {
        result.push(separator);
      }
      result.push(chunk);
    }
    return new SQL(result);
  }
  sql2.join = join;
  function identifier(value) {
    return new Name(value);
  }
  sql2.identifier = identifier;
  function placeholder2(name2) {
    return new Placeholder(name2);
  }
  sql2.placeholder = placeholder2;
  function param2(value, encoder) {
    return new Param(value, encoder);
  }
  sql2.param = param2;
})(sql || (sql = {}));
((SQL2) => {
  class Aliased {
    constructor(sql2, fieldAlias) {
      this.sql = sql2;
      this.fieldAlias = fieldAlias;
    }
    static [entityKind] = "SQL.Aliased";
    /** @internal */
    isSelectionField = false;
    getSQL() {
      return this.sql;
    }
    /** @internal */
    clone() {
      return new Aliased(this.sql, this.fieldAlias);
    }
  }
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));
var Placeholder = class {
  constructor(name2) {
    this.name = name2;
  }
  static [entityKind] = "Placeholder";
  getSQL() {
    return new SQL([this]);
  }
};
function fillPlaceholders(params, values) {
  return params.map((p) => {
    if (is(p, Placeholder)) {
      if (!(p.name in values)) {
        throw new Error(`No value for placeholder "${p.name}" was provided`);
      }
      return values[p.name];
    }
    if (is(p, Param) && is(p.value, Placeholder)) {
      if (!(p.value.name in values)) {
        throw new Error(`No value for placeholder "${p.value.name}" was provided`);
      }
      return p.encoder.mapToDriverValue(values[p.value.name]);
    }
    return p;
  });
}
var IsDrizzleView = Symbol.for("drizzle:IsDrizzleView");
var View = class {
  static [entityKind] = "View";
  /** @internal */
  [ViewBaseConfig];
  /** @internal */
  [IsDrizzleView] = true;
  constructor({ name: name2, schema, selectedFields, query }) {
    this[ViewBaseConfig] = {
      name: name2,
      originalName: name2,
      schema,
      selectedFields,
      query,
      isExisting: !query,
      isAlias: false
    };
  }
  getSQL() {
    return new SQL([this]);
  }
};
function isView(view) {
  return typeof view === "object" && view !== null && IsDrizzleView in view;
}
Column.prototype.getSQL = function() {
  return new SQL([this]);
};
Table.prototype.getSQL = function() {
  return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
  return new SQL([this]);
};

// node_modules/drizzle-orm/alias.js
var ColumnAliasProxyHandler = class {
  constructor(table) {
    this.table = table;
  }
  static [entityKind] = "ColumnAliasProxyHandler";
  get(columnObj, prop) {
    if (prop === "table") {
      return this.table;
    }
    return columnObj[prop];
  }
};
var TableAliasProxyHandler = class {
  constructor(alias, replaceOriginalName) {
    this.alias = alias;
    this.replaceOriginalName = replaceOriginalName;
  }
  static [entityKind] = "TableAliasProxyHandler";
  get(target, prop) {
    if (prop === Table.Symbol.IsAlias) {
      return true;
    }
    if (prop === Table.Symbol.Name) {
      return this.alias;
    }
    if (this.replaceOriginalName && prop === Table.Symbol.OriginalName) {
      return this.alias;
    }
    if (prop === ViewBaseConfig) {
      return {
        ...target[ViewBaseConfig],
        name: this.alias,
        isAlias: true
      };
    }
    if (prop === Table.Symbol.Columns) {
      const columns = target[Table.Symbol.Columns];
      if (!columns) {
        return columns;
      }
      const proxiedColumns = {};
      Object.keys(columns).map((key) => {
        proxiedColumns[key] = new Proxy(
          columns[key],
          new ColumnAliasProxyHandler(new Proxy(target, this))
        );
      });
      return proxiedColumns;
    }
    const value = target[prop];
    if (is(value, Column)) {
      return new Proxy(value, new ColumnAliasProxyHandler(new Proxy(target, this)));
    }
    return value;
  }
};
var RelationTableAliasProxyHandler = class {
  constructor(alias) {
    this.alias = alias;
  }
  static [entityKind] = "RelationTableAliasProxyHandler";
  get(target, prop) {
    if (prop === "sourceTable") {
      return aliasedTable(target.sourceTable, this.alias);
    }
    return target[prop];
  }
};
function aliasedTable(table, tableAlias) {
  return new Proxy(table, new TableAliasProxyHandler(tableAlias, false));
}
function aliasedTableColumn(column, tableAlias) {
  return new Proxy(
    column,
    new ColumnAliasProxyHandler(new Proxy(column.table, new TableAliasProxyHandler(tableAlias, false)))
  );
}
function mapColumnsInAliasedSQLToAlias(query, alias) {
  return new SQL.Aliased(mapColumnsInSQLToAlias(query.sql, alias), query.fieldAlias);
}
function mapColumnsInSQLToAlias(query, alias) {
  return sql.join(query.queryChunks.map((c) => {
    if (is(c, Column)) {
      return aliasedTableColumn(c, alias);
    }
    if (is(c, SQL)) {
      return mapColumnsInSQLToAlias(c, alias);
    }
    if (is(c, SQL.Aliased)) {
      return mapColumnsInAliasedSQLToAlias(c, alias);
    }
    return c;
  }));
}

// node_modules/drizzle-orm/errors.js
var DrizzleError = class extends Error {
  static [entityKind] = "DrizzleError";
  constructor({ message, cause }) {
    super(message);
    this.name = "DrizzleError";
    this.cause = cause;
  }
};
var TransactionRollbackError = class extends DrizzleError {
  static [entityKind] = "TransactionRollbackError";
  constructor() {
    super({ message: "Rollback" });
  }
};

// node_modules/drizzle-orm/sql/expressions/conditions.js
function bindIfParam(value, column) {
  if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) {
    return new Param(value, column);
  }
  return value;
}
var eq = (left, right) => {
  return sql`${left} = ${bindIfParam(right, left)}`;
};
var ne = (left, right) => {
  return sql`${left} <> ${bindIfParam(right, left)}`;
};
function and(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" and ")),
    new StringChunk(")")
  ]);
}
function or(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" or ")),
    new StringChunk(")")
  ]);
}
function not(condition) {
  return sql`not ${condition}`;
}
var gt = (left, right) => {
  return sql`${left} > ${bindIfParam(right, left)}`;
};
var gte = (left, right) => {
  return sql`${left} >= ${bindIfParam(right, left)}`;
};
var lt = (left, right) => {
  return sql`${left} < ${bindIfParam(right, left)}`;
};
var lte = (left, right) => {
  return sql`${left} <= ${bindIfParam(right, left)}`;
};
function inArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`false`;
    }
    return sql`${column} in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} in ${bindIfParam(values, column)}`;
}
function notInArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`true`;
    }
    return sql`${column} not in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} not in ${bindIfParam(values, column)}`;
}
function isNull(value) {
  return sql`${value} is null`;
}
function isNotNull(value) {
  return sql`${value} is not null`;
}
function exists(subquery) {
  return sql`exists ${subquery}`;
}
function notExists(subquery) {
  return sql`not exists ${subquery}`;
}
function between(column, min, max) {
  return sql`${column} between ${bindIfParam(min, column)} and ${bindIfParam(
    max,
    column
  )}`;
}
function notBetween(column, min, max) {
  return sql`${column} not between ${bindIfParam(
    min,
    column
  )} and ${bindIfParam(max, column)}`;
}
function like(column, value) {
  return sql`${column} like ${value}`;
}
function notLike(column, value) {
  return sql`${column} not like ${value}`;
}
function ilike(column, value) {
  return sql`${column} ilike ${value}`;
}
function notIlike(column, value) {
  return sql`${column} not ilike ${value}`;
}

// node_modules/drizzle-orm/sql/expressions/select.js
function asc(column) {
  return sql`${column} asc`;
}
function desc(column) {
  return sql`${column} desc`;
}

// node_modules/drizzle-orm/logger.js
var ConsoleLogWriter = class {
  static [entityKind] = "ConsoleLogWriter";
  write(message) {
    console.log(message);
  }
};
var DefaultLogger = class {
  static [entityKind] = "DefaultLogger";
  writer;
  constructor(config) {
    this.writer = config?.writer ?? new ConsoleLogWriter();
  }
  logQuery(query, params) {
    const stringifiedParams = params.map((p) => {
      try {
        return JSON.stringify(p);
      } catch {
        return String(p);
      }
    });
    const paramsStr = stringifiedParams.length ? ` -- params: [${stringifiedParams.join(", ")}]` : "";
    this.writer.write(`Query: ${query}${paramsStr}`);
  }
};
var NoopLogger = class {
  static [entityKind] = "NoopLogger";
  logQuery() {
  }
};

// node_modules/drizzle-orm/query-promise.js
var QueryPromise = class {
  static [entityKind] = "QueryPromise";
  [Symbol.toStringTag] = "QueryPromise";
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
};

// node_modules/drizzle-orm/utils.js
function mapResultRow(columns, row, joinsNotNullableMap) {
  const nullifyMap = {};
  const result = columns.reduce(
    (result2, { path: path2, field }, columnIndex) => {
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      let node = result2;
      for (const [pathChunkIndex, pathChunk] of path2.entries()) {
        if (pathChunkIndex < path2.length - 1) {
          if (!(pathChunk in node)) {
            node[pathChunk] = {};
          }
          node = node[pathChunk];
        } else {
          const rawValue = row[columnIndex];
          const value = node[pathChunk] = rawValue === null ? null : decoder.mapFromDriverValue(rawValue);
          if (joinsNotNullableMap && is(field, Column) && path2.length === 2) {
            const objectName = path2[0];
            if (!(objectName in nullifyMap)) {
              nullifyMap[objectName] = value === null ? getTableName(field.table) : false;
            } else if (typeof nullifyMap[objectName] === "string" && nullifyMap[objectName] !== getTableName(field.table)) {
              nullifyMap[objectName] = false;
            }
          }
        }
      }
      return result2;
    },
    {}
  );
  if (joinsNotNullableMap && Object.keys(nullifyMap).length > 0) {
    for (const [objectName, tableName] of Object.entries(nullifyMap)) {
      if (typeof tableName === "string" && !joinsNotNullableMap[tableName]) {
        result[objectName] = null;
      }
    }
  }
  return result;
}
function orderSelectedFields(fields, pathPrefix) {
  return Object.entries(fields).reduce((result, [name, field]) => {
    if (typeof name !== "string") {
      return result;
    }
    const newPath = pathPrefix ? [...pathPrefix, name] : [name];
    if (is(field, Column) || is(field, SQL) || is(field, SQL.Aliased)) {
      result.push({ path: newPath, field });
    } else if (is(field, Table)) {
      result.push(...orderSelectedFields(field[Table.Symbol.Columns], newPath));
    } else {
      result.push(...orderSelectedFields(field, newPath));
    }
    return result;
  }, []);
}
function haveSameKeys(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const [index, key] of leftKeys.entries()) {
    if (key !== rightKeys[index]) {
      return false;
    }
  }
  return true;
}
function mapUpdateSet(table, values) {
  const entries = Object.entries(values).filter(([, value]) => value !== void 0).map(([key, value]) => {
    if (is(value, SQL) || is(value, Column)) {
      return [key, value];
    } else {
      return [key, new Param(value, table[Table.Symbol.Columns][key])];
    }
  });
  if (entries.length === 0) {
    throw new Error("No values to set");
  }
  return Object.fromEntries(entries);
}
function applyMixins(baseClass, extendedClasses) {
  for (const extendedClass of extendedClasses) {
    for (const name of Object.getOwnPropertyNames(extendedClass.prototype)) {
      if (name === "constructor")
        continue;
      Object.defineProperty(
        baseClass.prototype,
        name,
        Object.getOwnPropertyDescriptor(extendedClass.prototype, name) || /* @__PURE__ */ Object.create(null)
      );
    }
  }
}
function getTableColumns(table) {
  return table[Table.Symbol.Columns];
}
function getViewSelectedFields(view) {
  return view[ViewBaseConfig].selectedFields;
}
function getTableLikeName(table) {
  return is(table, Subquery) ? table._.alias : is(table, View) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : table[Table.Symbol.IsAlias] ? table[Table.Symbol.Name] : table[Table.Symbol.BaseName];
}
function getColumnNameAndConfig(a, b) {
  return {
    name: typeof a === "string" && a.length > 0 ? a : "",
    config: typeof a === "object" ? a : b
  };
}
function isConfig(data) {
  if (typeof data !== "object" || data === null)
    return false;
  if (data.constructor.name !== "Object")
    return false;
  if ("logger" in data) {
    const type = typeof data["logger"];
    if (type !== "boolean" && (type !== "object" || typeof data["logger"]["logQuery"] !== "function") && type !== "undefined")
      return false;
    return true;
  }
  if ("schema" in data) {
    const type = typeof data["logger"];
    if (type !== "object" && type !== "undefined")
      return false;
    return true;
  }
  if ("casing" in data) {
    const type = typeof data["logger"];
    if (type !== "string" && type !== "undefined")
      return false;
    return true;
  }
  if ("mode" in data) {
    if (data["mode"] !== "default" || data["mode"] !== "planetscale" || data["mode"] !== void 0)
      return false;
    return true;
  }
  if ("connection" in data) {
    const type = typeof data["connection"];
    if (type !== "string" && type !== "object" && type !== "undefined")
      return false;
    return true;
  }
  if ("client" in data) {
    const type = typeof data["client"];
    if (type !== "object" && type !== "function" && type !== "undefined")
      return false;
    return true;
  }
  if (Object.keys(data).length === 0)
    return true;
  return false;
}

// node_modules/drizzle-orm/pg-core/columns/int.common.js
var PgIntColumnBaseBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgIntColumnBaseBuilder";
  generatedAlwaysAsIdentity(sequence) {
    if (sequence) {
      const { name, ...options } = sequence;
      this.config.generatedIdentity = {
        type: "always",
        sequenceName: name,
        sequenceOptions: options
      };
    } else {
      this.config.generatedIdentity = {
        type: "always"
      };
    }
    this.config.hasDefault = true;
    this.config.notNull = true;
    return this;
  }
  generatedByDefaultAsIdentity(sequence) {
    if (sequence) {
      const { name, ...options } = sequence;
      this.config.generatedIdentity = {
        type: "byDefault",
        sequenceName: name,
        sequenceOptions: options
      };
    } else {
      this.config.generatedIdentity = {
        type: "byDefault"
      };
    }
    this.config.hasDefault = true;
    this.config.notNull = true;
    return this;
  }
};

// node_modules/drizzle-orm/pg-core/columns/bigint.js
var PgBigInt53Builder = class extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgBigInt53Builder";
  constructor(name) {
    super(name, "number", "PgBigInt53");
  }
  /** @internal */
  build(table) {
    return new PgBigInt53(table, this.config);
  }
};
var PgBigInt53 = class extends PgColumn {
  static [entityKind] = "PgBigInt53";
  getSQLType() {
    return "bigint";
  }
  mapFromDriverValue(value) {
    if (typeof value === "number") {
      return value;
    }
    return Number(value);
  }
};
var PgBigInt64Builder = class extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgBigInt64Builder";
  constructor(name) {
    super(name, "bigint", "PgBigInt64");
  }
  /** @internal */
  build(table) {
    return new PgBigInt64(
      table,
      this.config
    );
  }
};
var PgBigInt64 = class extends PgColumn {
  static [entityKind] = "PgBigInt64";
  getSQLType() {
    return "bigint";
  }
  // eslint-disable-next-line unicorn/prefer-native-coercion-functions
  mapFromDriverValue(value) {
    return BigInt(value);
  }
};
function bigint(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config.mode === "number") {
    return new PgBigInt53Builder(name);
  }
  return new PgBigInt64Builder(name);
}

// node_modules/drizzle-orm/pg-core/columns/bigserial.js
var PgBigSerial53Builder = class extends PgColumnBuilder {
  static [entityKind] = "PgBigSerial53Builder";
  constructor(name) {
    super(name, "number", "PgBigSerial53");
    this.config.hasDefault = true;
    this.config.notNull = true;
  }
  /** @internal */
  build(table) {
    return new PgBigSerial53(
      table,
      this.config
    );
  }
};
var PgBigSerial53 = class extends PgColumn {
  static [entityKind] = "PgBigSerial53";
  getSQLType() {
    return "bigserial";
  }
  mapFromDriverValue(value) {
    if (typeof value === "number") {
      return value;
    }
    return Number(value);
  }
};
var PgBigSerial64Builder = class extends PgColumnBuilder {
  static [entityKind] = "PgBigSerial64Builder";
  constructor(name) {
    super(name, "bigint", "PgBigSerial64");
    this.config.hasDefault = true;
  }
  /** @internal */
  build(table) {
    return new PgBigSerial64(
      table,
      this.config
    );
  }
};
var PgBigSerial64 = class extends PgColumn {
  static [entityKind] = "PgBigSerial64";
  getSQLType() {
    return "bigserial";
  }
  // eslint-disable-next-line unicorn/prefer-native-coercion-functions
  mapFromDriverValue(value) {
    return BigInt(value);
  }
};
function bigserial(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config.mode === "number") {
    return new PgBigSerial53Builder(name);
  }
  return new PgBigSerial64Builder(name);
}

// node_modules/drizzle-orm/pg-core/columns/boolean.js
var PgBooleanBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgBooleanBuilder";
  constructor(name) {
    super(name, "boolean", "PgBoolean");
  }
  /** @internal */
  build(table) {
    return new PgBoolean(table, this.config);
  }
};
var PgBoolean = class extends PgColumn {
  static [entityKind] = "PgBoolean";
  getSQLType() {
    return "boolean";
  }
};
function boolean(name) {
  return new PgBooleanBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/char.js
var PgCharBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgCharBuilder";
  constructor(name, config) {
    super(name, "string", "PgChar");
    this.config.length = config.length;
    this.config.enumValues = config.enum;
  }
  /** @internal */
  build(table) {
    return new PgChar(
      table,
      this.config
    );
  }
};
var PgChar = class extends PgColumn {
  static [entityKind] = "PgChar";
  length = this.config.length;
  enumValues = this.config.enumValues;
  getSQLType() {
    return this.length === void 0 ? `char` : `char(${this.length})`;
  }
};
function char(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgCharBuilder(name, config);
}

// node_modules/drizzle-orm/pg-core/columns/cidr.js
var PgCidrBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgCidrBuilder";
  constructor(name) {
    super(name, "string", "PgCidr");
  }
  /** @internal */
  build(table) {
    return new PgCidr(table, this.config);
  }
};
var PgCidr = class extends PgColumn {
  static [entityKind] = "PgCidr";
  getSQLType() {
    return "cidr";
  }
};
function cidr(name) {
  return new PgCidrBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/custom.js
var PgCustomColumnBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgCustomColumnBuilder";
  constructor(name, fieldConfig, customTypeParams) {
    super(name, "custom", "PgCustomColumn");
    this.config.fieldConfig = fieldConfig;
    this.config.customTypeParams = customTypeParams;
  }
  /** @internal */
  build(table) {
    return new PgCustomColumn(
      table,
      this.config
    );
  }
};
var PgCustomColumn = class extends PgColumn {
  static [entityKind] = "PgCustomColumn";
  sqlName;
  mapTo;
  mapFrom;
  constructor(table, config) {
    super(table, config);
    this.sqlName = config.customTypeParams.dataType(config.fieldConfig);
    this.mapTo = config.customTypeParams.toDriver;
    this.mapFrom = config.customTypeParams.fromDriver;
  }
  getSQLType() {
    return this.sqlName;
  }
  mapFromDriverValue(value) {
    return typeof this.mapFrom === "function" ? this.mapFrom(value) : value;
  }
  mapToDriverValue(value) {
    return typeof this.mapTo === "function" ? this.mapTo(value) : value;
  }
};
function customType(customTypeParams) {
  return (a, b) => {
    const { name, config } = getColumnNameAndConfig(a, b);
    return new PgCustomColumnBuilder(name, config, customTypeParams);
  };
}

// node_modules/drizzle-orm/pg-core/columns/date.common.js
var PgDateColumnBaseBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgDateColumnBaseBuilder";
  defaultNow() {
    return this.default(sql`now()`);
  }
};

// node_modules/drizzle-orm/pg-core/columns/date.js
var PgDateBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgDateBuilder";
  constructor(name) {
    super(name, "date", "PgDate");
  }
  /** @internal */
  build(table) {
    return new PgDate(table, this.config);
  }
};
var PgDate = class extends PgColumn {
  static [entityKind] = "PgDate";
  getSQLType() {
    return "date";
  }
  mapFromDriverValue(value) {
    return new Date(value);
  }
  mapToDriverValue(value) {
    return value.toISOString();
  }
};
var PgDateStringBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgDateStringBuilder";
  constructor(name) {
    super(name, "string", "PgDateString");
  }
  /** @internal */
  build(table) {
    return new PgDateString(
      table,
      this.config
    );
  }
};
var PgDateString = class extends PgColumn {
  static [entityKind] = "PgDateString";
  getSQLType() {
    return "date";
  }
};
function date(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "date") {
    return new PgDateBuilder(name);
  }
  return new PgDateStringBuilder(name);
}

// node_modules/drizzle-orm/pg-core/columns/double-precision.js
var PgDoublePrecisionBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgDoublePrecisionBuilder";
  constructor(name) {
    super(name, "number", "PgDoublePrecision");
  }
  /** @internal */
  build(table) {
    return new PgDoublePrecision(
      table,
      this.config
    );
  }
};
var PgDoublePrecision = class extends PgColumn {
  static [entityKind] = "PgDoublePrecision";
  getSQLType() {
    return "double precision";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      return Number.parseFloat(value);
    }
    return value;
  }
};
function doublePrecision(name) {
  return new PgDoublePrecisionBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/inet.js
var PgInetBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgInetBuilder";
  constructor(name) {
    super(name, "string", "PgInet");
  }
  /** @internal */
  build(table) {
    return new PgInet(table, this.config);
  }
};
var PgInet = class extends PgColumn {
  static [entityKind] = "PgInet";
  getSQLType() {
    return "inet";
  }
};
function inet(name) {
  return new PgInetBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/integer.js
var PgIntegerBuilder = class extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgIntegerBuilder";
  constructor(name) {
    super(name, "number", "PgInteger");
  }
  /** @internal */
  build(table) {
    return new PgInteger(table, this.config);
  }
};
var PgInteger = class extends PgColumn {
  static [entityKind] = "PgInteger";
  getSQLType() {
    return "integer";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      return Number.parseInt(value);
    }
    return value;
  }
};
function integer(name) {
  return new PgIntegerBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/interval.js
var PgIntervalBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgIntervalBuilder";
  constructor(name, intervalConfig) {
    super(name, "string", "PgInterval");
    this.config.intervalConfig = intervalConfig;
  }
  /** @internal */
  build(table) {
    return new PgInterval(table, this.config);
  }
};
var PgInterval = class extends PgColumn {
  static [entityKind] = "PgInterval";
  fields = this.config.intervalConfig.fields;
  precision = this.config.intervalConfig.precision;
  getSQLType() {
    const fields = this.fields ? ` ${this.fields}` : "";
    const precision = this.precision ? `(${this.precision})` : "";
    return `interval${fields}${precision}`;
  }
};
function interval(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgIntervalBuilder(name, config);
}

// node_modules/drizzle-orm/pg-core/columns/json.js
var PgJsonBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgJsonBuilder";
  constructor(name) {
    super(name, "json", "PgJson");
  }
  /** @internal */
  build(table) {
    return new PgJson(table, this.config);
  }
};
var PgJson = class extends PgColumn {
  static [entityKind] = "PgJson";
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return "json";
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
};
function json(name) {
  return new PgJsonBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/jsonb.js
var PgJsonbBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgJsonbBuilder";
  constructor(name) {
    super(name, "json", "PgJsonb");
  }
  /** @internal */
  build(table) {
    return new PgJsonb(table, this.config);
  }
};
var PgJsonb = class extends PgColumn {
  static [entityKind] = "PgJsonb";
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return "jsonb";
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
};
function jsonb(name) {
  return new PgJsonbBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/line.js
var PgLineBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgLineBuilder";
  constructor(name) {
    super(name, "array", "PgLine");
  }
  /** @internal */
  build(table) {
    return new PgLineTuple(
      table,
      this.config
    );
  }
};
var PgLineTuple = class extends PgColumn {
  static [entityKind] = "PgLine";
  getSQLType() {
    return "line";
  }
  mapFromDriverValue(value) {
    const [a, b, c] = value.slice(1, -1).split(",");
    return [Number.parseFloat(a), Number.parseFloat(b), Number.parseFloat(c)];
  }
  mapToDriverValue(value) {
    return `{${value[0]},${value[1]},${value[2]}}`;
  }
};
var PgLineABCBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgLineABCBuilder";
  constructor(name) {
    super(name, "json", "PgLineABC");
  }
  /** @internal */
  build(table) {
    return new PgLineABC(
      table,
      this.config
    );
  }
};
var PgLineABC = class extends PgColumn {
  static [entityKind] = "PgLineABC";
  getSQLType() {
    return "line";
  }
  mapFromDriverValue(value) {
    const [a, b, c] = value.slice(1, -1).split(",");
    return { a: Number.parseFloat(a), b: Number.parseFloat(b), c: Number.parseFloat(c) };
  }
  mapToDriverValue(value) {
    return `{${value.a},${value.b},${value.c}}`;
  }
};
function line(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (!config?.mode || config.mode === "tuple") {
    return new PgLineBuilder(name);
  }
  return new PgLineABCBuilder(name);
}

// node_modules/drizzle-orm/pg-core/columns/macaddr.js
var PgMacaddrBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgMacaddrBuilder";
  constructor(name) {
    super(name, "string", "PgMacaddr");
  }
  /** @internal */
  build(table) {
    return new PgMacaddr(table, this.config);
  }
};
var PgMacaddr = class extends PgColumn {
  static [entityKind] = "PgMacaddr";
  getSQLType() {
    return "macaddr";
  }
};
function macaddr(name) {
  return new PgMacaddrBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/macaddr8.js
var PgMacaddr8Builder = class extends PgColumnBuilder {
  static [entityKind] = "PgMacaddr8Builder";
  constructor(name) {
    super(name, "string", "PgMacaddr8");
  }
  /** @internal */
  build(table) {
    return new PgMacaddr8(table, this.config);
  }
};
var PgMacaddr8 = class extends PgColumn {
  static [entityKind] = "PgMacaddr8";
  getSQLType() {
    return "macaddr8";
  }
};
function macaddr8(name) {
  return new PgMacaddr8Builder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/numeric.js
var PgNumericBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgNumericBuilder";
  constructor(name, precision, scale) {
    super(name, "string", "PgNumeric");
    this.config.precision = precision;
    this.config.scale = scale;
  }
  /** @internal */
  build(table) {
    return new PgNumeric(table, this.config);
  }
};
var PgNumeric = class extends PgColumn {
  static [entityKind] = "PgNumeric";
  precision;
  scale;
  constructor(table, config) {
    super(table, config);
    this.precision = config.precision;
    this.scale = config.scale;
  }
  getSQLType() {
    if (this.precision !== void 0 && this.scale !== void 0) {
      return `numeric(${this.precision}, ${this.scale})`;
    } else if (this.precision === void 0) {
      return "numeric";
    } else {
      return `numeric(${this.precision})`;
    }
  }
};
function numeric(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgNumericBuilder(name, config?.precision, config?.scale);
}

// node_modules/drizzle-orm/pg-core/columns/point.js
var PgPointTupleBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgPointTupleBuilder";
  constructor(name) {
    super(name, "array", "PgPointTuple");
  }
  /** @internal */
  build(table) {
    return new PgPointTuple(
      table,
      this.config
    );
  }
};
var PgPointTuple = class extends PgColumn {
  static [entityKind] = "PgPointTuple";
  getSQLType() {
    return "point";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      const [x, y] = value.slice(1, -1).split(",");
      return [Number.parseFloat(x), Number.parseFloat(y)];
    }
    return [value.x, value.y];
  }
  mapToDriverValue(value) {
    return `(${value[0]},${value[1]})`;
  }
};
var PgPointObjectBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgPointObjectBuilder";
  constructor(name) {
    super(name, "json", "PgPointObject");
  }
  /** @internal */
  build(table) {
    return new PgPointObject(
      table,
      this.config
    );
  }
};
var PgPointObject = class extends PgColumn {
  static [entityKind] = "PgPointObject";
  getSQLType() {
    return "point";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      const [x, y] = value.slice(1, -1).split(",");
      return { x: Number.parseFloat(x), y: Number.parseFloat(y) };
    }
    return value;
  }
  mapToDriverValue(value) {
    return `(${value.x},${value.y})`;
  }
};
function point(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (!config?.mode || config.mode === "tuple") {
    return new PgPointTupleBuilder(name);
  }
  return new PgPointObjectBuilder(name);
}

// node_modules/drizzle-orm/pg-core/columns/postgis_extension/utils.js
function hexToBytes(hex) {
  const bytes = [];
  for (let c = 0; c < hex.length; c += 2) {
    bytes.push(Number.parseInt(hex.slice(c, c + 2), 16));
  }
  return new Uint8Array(bytes);
}
function bytesToFloat64(bytes, offset) {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  for (let i = 0; i < 8; i++) {
    view.setUint8(i, bytes[offset + i]);
  }
  return view.getFloat64(0, true);
}
function parseEWKB(hex) {
  const bytes = hexToBytes(hex);
  let offset = 0;
  const byteOrder = bytes[offset];
  offset += 1;
  const view = new DataView(bytes.buffer);
  const geomType = view.getUint32(offset, byteOrder === 1);
  offset += 4;
  let _srid;
  if (geomType & 536870912) {
    _srid = view.getUint32(offset, byteOrder === 1);
    offset += 4;
  }
  if ((geomType & 65535) === 1) {
    const x = bytesToFloat64(bytes, offset);
    offset += 8;
    const y = bytesToFloat64(bytes, offset);
    offset += 8;
    return [x, y];
  }
  throw new Error("Unsupported geometry type");
}

// node_modules/drizzle-orm/pg-core/columns/postgis_extension/geometry.js
var PgGeometryBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgGeometryBuilder";
  constructor(name) {
    super(name, "array", "PgGeometry");
  }
  /** @internal */
  build(table) {
    return new PgGeometry(
      table,
      this.config
    );
  }
};
var PgGeometry = class extends PgColumn {
  static [entityKind] = "PgGeometry";
  getSQLType() {
    return "geometry(point)";
  }
  mapFromDriverValue(value) {
    return parseEWKB(value);
  }
  mapToDriverValue(value) {
    return `point(${value[0]} ${value[1]})`;
  }
};
var PgGeometryObjectBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgGeometryObjectBuilder";
  constructor(name) {
    super(name, "json", "PgGeometryObject");
  }
  /** @internal */
  build(table) {
    return new PgGeometryObject(
      table,
      this.config
    );
  }
};
var PgGeometryObject = class extends PgColumn {
  static [entityKind] = "PgGeometryObject";
  getSQLType() {
    return "geometry(point)";
  }
  mapFromDriverValue(value) {
    const parsed = parseEWKB(value);
    return { x: parsed[0], y: parsed[1] };
  }
  mapToDriverValue(value) {
    return `point(${value.x} ${value.y})`;
  }
};
function geometry(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (!config?.mode || config.mode === "tuple") {
    return new PgGeometryBuilder(name);
  }
  return new PgGeometryObjectBuilder(name);
}

// node_modules/drizzle-orm/pg-core/columns/real.js
var PgRealBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgRealBuilder";
  constructor(name, length) {
    super(name, "number", "PgReal");
    this.config.length = length;
  }
  /** @internal */
  build(table) {
    return new PgReal(table, this.config);
  }
};
var PgReal = class extends PgColumn {
  static [entityKind] = "PgReal";
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return "real";
  }
  mapFromDriverValue = (value) => {
    if (typeof value === "string") {
      return Number.parseFloat(value);
    }
    return value;
  };
};
function real(name) {
  return new PgRealBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/serial.js
var PgSerialBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgSerialBuilder";
  constructor(name) {
    super(name, "number", "PgSerial");
    this.config.hasDefault = true;
    this.config.notNull = true;
  }
  /** @internal */
  build(table) {
    return new PgSerial(table, this.config);
  }
};
var PgSerial = class extends PgColumn {
  static [entityKind] = "PgSerial";
  getSQLType() {
    return "serial";
  }
};
function serial(name) {
  return new PgSerialBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/smallint.js
var PgSmallIntBuilder = class extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgSmallIntBuilder";
  constructor(name) {
    super(name, "number", "PgSmallInt");
  }
  /** @internal */
  build(table) {
    return new PgSmallInt(table, this.config);
  }
};
var PgSmallInt = class extends PgColumn {
  static [entityKind] = "PgSmallInt";
  getSQLType() {
    return "smallint";
  }
  mapFromDriverValue = (value) => {
    if (typeof value === "string") {
      return Number(value);
    }
    return value;
  };
};
function smallint(name) {
  return new PgSmallIntBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/smallserial.js
var PgSmallSerialBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgSmallSerialBuilder";
  constructor(name) {
    super(name, "number", "PgSmallSerial");
    this.config.hasDefault = true;
    this.config.notNull = true;
  }
  /** @internal */
  build(table) {
    return new PgSmallSerial(
      table,
      this.config
    );
  }
};
var PgSmallSerial = class extends PgColumn {
  static [entityKind] = "PgSmallSerial";
  getSQLType() {
    return "smallserial";
  }
};
function smallserial(name) {
  return new PgSmallSerialBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/text.js
var PgTextBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgTextBuilder";
  constructor(name, config) {
    super(name, "string", "PgText");
    this.config.enumValues = config.enum;
  }
  /** @internal */
  build(table) {
    return new PgText(table, this.config);
  }
};
var PgText = class extends PgColumn {
  static [entityKind] = "PgText";
  enumValues = this.config.enumValues;
  getSQLType() {
    return "text";
  }
};
function text(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgTextBuilder(name, config);
}

// node_modules/drizzle-orm/pg-core/columns/time.js
var PgTimeBuilder = class extends PgDateColumnBaseBuilder {
  constructor(name, withTimezone, precision) {
    super(name, "string", "PgTime");
    this.withTimezone = withTimezone;
    this.precision = precision;
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  static [entityKind] = "PgTimeBuilder";
  /** @internal */
  build(table) {
    return new PgTime(table, this.config);
  }
};
var PgTime = class extends PgColumn {
  static [entityKind] = "PgTime";
  withTimezone;
  precision;
  constructor(table, config) {
    super(table, config);
    this.withTimezone = config.withTimezone;
    this.precision = config.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : `(${this.precision})`;
    return `time${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
};
function time(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgTimeBuilder(name, config.withTimezone ?? false, config.precision);
}

// node_modules/drizzle-orm/pg-core/columns/timestamp.js
var PgTimestampBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgTimestampBuilder";
  constructor(name, withTimezone, precision) {
    super(name, "date", "PgTimestamp");
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  /** @internal */
  build(table) {
    return new PgTimestamp(table, this.config);
  }
};
var PgTimestamp = class extends PgColumn {
  static [entityKind] = "PgTimestamp";
  withTimezone;
  precision;
  constructor(table, config) {
    super(table, config);
    this.withTimezone = config.withTimezone;
    this.precision = config.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : ` (${this.precision})`;
    return `timestamp${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
  mapFromDriverValue = (value) => {
    return new Date(this.withTimezone ? value : value + "+0000");
  };
  mapToDriverValue = (value) => {
    return value.toISOString();
  };
};
var PgTimestampStringBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgTimestampStringBuilder";
  constructor(name, withTimezone, precision) {
    super(name, "string", "PgTimestampString");
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  /** @internal */
  build(table) {
    return new PgTimestampString(
      table,
      this.config
    );
  }
};
var PgTimestampString = class extends PgColumn {
  static [entityKind] = "PgTimestampString";
  withTimezone;
  precision;
  constructor(table, config) {
    super(table, config);
    this.withTimezone = config.withTimezone;
    this.precision = config.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : `(${this.precision})`;
    return `timestamp${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
};
function timestamp(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "string") {
    return new PgTimestampStringBuilder(name, config.withTimezone ?? false, config.precision);
  }
  return new PgTimestampBuilder(name, config?.withTimezone ?? false, config?.precision);
}

// node_modules/drizzle-orm/pg-core/columns/uuid.js
var PgUUIDBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgUUIDBuilder";
  constructor(name) {
    super(name, "string", "PgUUID");
  }
  /**
   * Adds `default gen_random_uuid()` to the column definition.
   */
  defaultRandom() {
    return this.default(sql`gen_random_uuid()`);
  }
  /** @internal */
  build(table) {
    return new PgUUID(table, this.config);
  }
};
var PgUUID = class extends PgColumn {
  static [entityKind] = "PgUUID";
  getSQLType() {
    return "uuid";
  }
};
function uuid(name) {
  return new PgUUIDBuilder(name ?? "");
}

// node_modules/drizzle-orm/pg-core/columns/varchar.js
var PgVarcharBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgVarcharBuilder";
  constructor(name, config) {
    super(name, "string", "PgVarchar");
    this.config.length = config.length;
    this.config.enumValues = config.enum;
  }
  /** @internal */
  build(table) {
    return new PgVarchar(
      table,
      this.config
    );
  }
};
var PgVarchar = class extends PgColumn {
  static [entityKind] = "PgVarchar";
  length = this.config.length;
  enumValues = this.config.enumValues;
  getSQLType() {
    return this.length === void 0 ? `varchar` : `varchar(${this.length})`;
  }
};
function varchar(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgVarcharBuilder(name, config);
}

// node_modules/drizzle-orm/pg-core/columns/vector_extension/bit.js
var PgBinaryVectorBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgBinaryVectorBuilder";
  constructor(name, config) {
    super(name, "string", "PgBinaryVector");
    this.config.dimensions = config.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgBinaryVector(
      table,
      this.config
    );
  }
};
var PgBinaryVector = class extends PgColumn {
  static [entityKind] = "PgBinaryVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `bit(${this.dimensions})`;
  }
};
function bit(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgBinaryVectorBuilder(name, config);
}

// node_modules/drizzle-orm/pg-core/columns/vector_extension/halfvec.js
var PgHalfVectorBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgHalfVectorBuilder";
  constructor(name, config) {
    super(name, "array", "PgHalfVector");
    this.config.dimensions = config.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgHalfVector(
      table,
      this.config
    );
  }
};
var PgHalfVector = class extends PgColumn {
  static [entityKind] = "PgHalfVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `halfvec(${this.dimensions})`;
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    return value.slice(1, -1).split(",").map((v) => Number.parseFloat(v));
  }
};
function halfvec(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgHalfVectorBuilder(name, config);
}

// node_modules/drizzle-orm/pg-core/columns/vector_extension/sparsevec.js
var PgSparseVectorBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgSparseVectorBuilder";
  constructor(name, config) {
    super(name, "string", "PgSparseVector");
    this.config.dimensions = config.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgSparseVector(
      table,
      this.config
    );
  }
};
var PgSparseVector = class extends PgColumn {
  static [entityKind] = "PgSparseVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `sparsevec(${this.dimensions})`;
  }
};
function sparsevec(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgSparseVectorBuilder(name, config);
}

// node_modules/drizzle-orm/pg-core/columns/vector_extension/vector.js
var PgVectorBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgVectorBuilder";
  constructor(name, config) {
    super(name, "array", "PgVector");
    this.config.dimensions = config.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgVector(
      table,
      this.config
    );
  }
};
var PgVector = class extends PgColumn {
  static [entityKind] = "PgVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `vector(${this.dimensions})`;
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    return value.slice(1, -1).split(",").map((v) => Number.parseFloat(v));
  }
};
function vector(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgVectorBuilder(name, config);
}

// node_modules/drizzle-orm/pg-core/columns/all.js
function getPgColumnBuilders() {
  return {
    bigint,
    bigserial,
    boolean,
    char,
    cidr,
    customType,
    date,
    doublePrecision,
    inet,
    integer,
    interval,
    json,
    jsonb,
    line,
    macaddr,
    macaddr8,
    numeric,
    point,
    geometry,
    real,
    serial,
    smallint,
    smallserial,
    text,
    time,
    timestamp,
    uuid,
    varchar,
    bit,
    halfvec,
    sparsevec,
    vector
  };
}

// node_modules/drizzle-orm/pg-core/table.js
var InlineForeignKeys = Symbol.for("drizzle:PgInlineForeignKeys");
var EnableRLS = Symbol.for("drizzle:EnableRLS");
var PgTable = class extends Table {
  static [entityKind] = "PgTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys,
    EnableRLS
  });
  /**@internal */
  [InlineForeignKeys] = [];
  /** @internal */
  [EnableRLS] = false;
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
};
function pgTableWithSchema(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new PgTable(name, schema, baseName);
  const parsedColumns = typeof columns === "function" ? columns(getPgColumnBuilders()) : columns;
  const builtColumns = Object.fromEntries(
    Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name2);
      const column = colBuilder.build(rawTable);
      rawTable[InlineForeignKeys].push(...colBuilder.buildForeignKeys(column, rawTable));
      return [name2, column];
    })
  );
  const builtColumnsForExtraConfig = Object.fromEntries(
    Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name2);
      const column = colBuilder.buildExtraConfigColumn(rawTable);
      return [name2, column];
    })
  );
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  table[Table.Symbol.ExtraConfigColumns] = builtColumnsForExtraConfig;
  if (extraConfig) {
    table[PgTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return Object.assign(table, {
    enableRLS: () => {
      table[PgTable.Symbol.EnableRLS] = true;
      return table;
    }
  });
}
var pgTable = (name, columns, extraConfig) => {
  return pgTableWithSchema(name, columns, extraConfig, void 0);
};

// node_modules/drizzle-orm/pg-core/primary-keys.js
var PrimaryKeyBuilder = class {
  static [entityKind] = "PgPrimaryKeyBuilder";
  /** @internal */
  columns;
  /** @internal */
  name;
  constructor(columns, name) {
    this.columns = columns;
    this.name = name;
  }
  /** @internal */
  build(table) {
    return new PrimaryKey(table, this.columns, this.name);
  }
};
var PrimaryKey = class {
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name;
  }
  static [entityKind] = "PgPrimaryKey";
  columns;
  name;
  getName() {
    return this.name ?? `${this.table[PgTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
  }
};

// node_modules/drizzle-orm/relations.js
var Relation = class {
  constructor(sourceTable, referencedTable, relationName) {
    this.sourceTable = sourceTable;
    this.referencedTable = referencedTable;
    this.relationName = relationName;
    this.referencedTableName = referencedTable[Table.Symbol.Name];
  }
  static [entityKind] = "Relation";
  referencedTableName;
  fieldName;
};
var Relations = class {
  constructor(table, config) {
    this.table = table;
    this.config = config;
  }
  static [entityKind] = "Relations";
};
var One = class _One extends Relation {
  constructor(sourceTable, referencedTable, config, isNullable) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
    this.isNullable = isNullable;
  }
  static [entityKind] = "One";
  withFieldName(fieldName) {
    const relation = new _One(
      this.sourceTable,
      this.referencedTable,
      this.config,
      this.isNullable
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
var Many = class _Many extends Relation {
  constructor(sourceTable, referencedTable, config) {
    super(sourceTable, referencedTable, config?.relationName);
    this.config = config;
  }
  static [entityKind] = "Many";
  withFieldName(fieldName) {
    const relation = new _Many(
      this.sourceTable,
      this.referencedTable,
      this.config
    );
    relation.fieldName = fieldName;
    return relation;
  }
};
function getOperators() {
  return {
    and,
    between,
    eq,
    exists,
    gt,
    gte,
    ilike,
    inArray,
    isNull,
    isNotNull,
    like,
    lt,
    lte,
    ne,
    not,
    notBetween,
    notExists,
    notLike,
    notIlike,
    notInArray,
    or,
    sql
  };
}
function getOrderByOperators() {
  return {
    sql,
    asc,
    desc
  };
}
function extractTablesRelationalConfig(schema, configHelpers) {
  if (Object.keys(schema).length === 1 && "default" in schema && !is(schema["default"], Table)) {
    schema = schema["default"];
  }
  const tableNamesMap = {};
  const relationsBuffer = {};
  const tablesConfig = {};
  for (const [key, value] of Object.entries(schema)) {
    if (is(value, Table)) {
      const dbName = getTableUniqueName(value);
      const bufferedRelations = relationsBuffer[dbName];
      tableNamesMap[dbName] = key;
      tablesConfig[key] = {
        tsName: key,
        dbName: value[Table.Symbol.Name],
        schema: value[Table.Symbol.Schema],
        columns: value[Table.Symbol.Columns],
        relations: bufferedRelations?.relations ?? {},
        primaryKey: bufferedRelations?.primaryKey ?? []
      };
      for (const column of Object.values(
        value[Table.Symbol.Columns]
      )) {
        if (column.primary) {
          tablesConfig[key].primaryKey.push(column);
        }
      }
      const extraConfig = value[Table.Symbol.ExtraConfigBuilder]?.(value[Table.Symbol.ExtraConfigColumns]);
      if (extraConfig) {
        for (const configEntry of Object.values(extraConfig)) {
          if (is(configEntry, PrimaryKeyBuilder)) {
            tablesConfig[key].primaryKey.push(...configEntry.columns);
          }
        }
      }
    } else if (is(value, Relations)) {
      const dbName = getTableUniqueName(value.table);
      const tableName = tableNamesMap[dbName];
      const relations2 = value.config(
        configHelpers(value.table)
      );
      let primaryKey;
      for (const [relationName, relation] of Object.entries(relations2)) {
        if (tableName) {
          const tableConfig = tablesConfig[tableName];
          tableConfig.relations[relationName] = relation;
          if (primaryKey) {
            tableConfig.primaryKey.push(...primaryKey);
          }
        } else {
          if (!(dbName in relationsBuffer)) {
            relationsBuffer[dbName] = {
              relations: {},
              primaryKey
            };
          }
          relationsBuffer[dbName].relations[relationName] = relation;
        }
      }
    }
  }
  return { tables: tablesConfig, tableNamesMap };
}
function createOne(sourceTable) {
  return function one(table, config) {
    return new One(
      sourceTable,
      table,
      config,
      config?.fields.reduce((res, f) => res && f.notNull, true) ?? false
    );
  };
}
function createMany(sourceTable) {
  return function many(referencedTable, config) {
    return new Many(sourceTable, referencedTable, config);
  };
}
function normalizeRelation(schema, tableNamesMap, relation) {
  if (is(relation, One) && relation.config) {
    return {
      fields: relation.config.fields,
      references: relation.config.references
    };
  }
  const referencedTableTsName = tableNamesMap[getTableUniqueName(relation.referencedTable)];
  if (!referencedTableTsName) {
    throw new Error(
      `Table "${relation.referencedTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const referencedTableConfig = schema[referencedTableTsName];
  if (!referencedTableConfig) {
    throw new Error(`Table "${referencedTableTsName}" not found in schema`);
  }
  const sourceTable = relation.sourceTable;
  const sourceTableTsName = tableNamesMap[getTableUniqueName(sourceTable)];
  if (!sourceTableTsName) {
    throw new Error(
      `Table "${sourceTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const reverseRelations = [];
  for (const referencedTableRelation of Object.values(
    referencedTableConfig.relations
  )) {
    if (relation.relationName && relation !== referencedTableRelation && referencedTableRelation.relationName === relation.relationName || !relation.relationName && referencedTableRelation.referencedTable === relation.sourceTable) {
      reverseRelations.push(referencedTableRelation);
    }
  }
  if (reverseRelations.length > 1) {
    throw relation.relationName ? new Error(
      `There are multiple relations with name "${relation.relationName}" in table "${referencedTableTsName}"`
    ) : new Error(
      `There are multiple relations between "${referencedTableTsName}" and "${relation.sourceTable[Table.Symbol.Name]}". Please specify relation name`
    );
  }
  if (reverseRelations[0] && is(reverseRelations[0], One) && reverseRelations[0].config) {
    return {
      fields: reverseRelations[0].config.references,
      references: reverseRelations[0].config.fields
    };
  }
  throw new Error(
    `There is not enough information to infer relation "${sourceTableTsName}.${relation.fieldName}"`
  );
}
function createTableRelationsHelpers(sourceTable) {
  return {
    one: createOne(sourceTable),
    many: createMany(sourceTable)
  };
}
function mapRelationalRow(tablesConfig, tableConfig, row, buildQueryResultSelection, mapColumnValue = (value) => value) {
  const result = {};
  for (const [
    selectionItemIndex,
    selectionItem
  ] of buildQueryResultSelection.entries()) {
    if (selectionItem.isJson) {
      const relation = tableConfig.relations[selectionItem.tsKey];
      const rawSubRows = row[selectionItemIndex];
      const subRows = typeof rawSubRows === "string" ? JSON.parse(rawSubRows) : rawSubRows;
      result[selectionItem.tsKey] = is(relation, One) ? subRows && mapRelationalRow(
        tablesConfig,
        tablesConfig[selectionItem.relationTableTsKey],
        subRows,
        selectionItem.selection,
        mapColumnValue
      ) : subRows.map(
        (subRow) => mapRelationalRow(
          tablesConfig,
          tablesConfig[selectionItem.relationTableTsKey],
          subRow,
          selectionItem.selection,
          mapColumnValue
        )
      );
    } else {
      const value = mapColumnValue(row[selectionItemIndex]);
      const field = selectionItem.field;
      let decoder;
      if (is(field, Column)) {
        decoder = field;
      } else if (is(field, SQL)) {
        decoder = field.decoder;
      } else {
        decoder = field.sql.decoder;
      }
      result[selectionItem.tsKey] = value === null ? null : decoder.mapFromDriverValue(value);
    }
  }
  return result;
}

// node_modules/drizzle-orm/selection-proxy.js
var SelectionProxyHandler = class _SelectionProxyHandler {
  static [entityKind] = "SelectionProxyHandler";
  config;
  constructor(config) {
    this.config = { ...config };
  }
  get(subquery, prop) {
    if (prop === "_") {
      return {
        ...subquery["_"],
        selectedFields: new Proxy(
          subquery._.selectedFields,
          this
        )
      };
    }
    if (prop === ViewBaseConfig) {
      return {
        ...subquery[ViewBaseConfig],
        selectedFields: new Proxy(
          subquery[ViewBaseConfig].selectedFields,
          this
        )
      };
    }
    if (typeof prop === "symbol") {
      return subquery[prop];
    }
    const columns = is(subquery, Subquery) ? subquery._.selectedFields : is(subquery, View) ? subquery[ViewBaseConfig].selectedFields : subquery;
    const value = columns[prop];
    if (is(value, SQL.Aliased)) {
      if (this.config.sqlAliasedBehavior === "sql" && !value.isSelectionField) {
        return value.sql;
      }
      const newValue = value.clone();
      newValue.isSelectionField = true;
      return newValue;
    }
    if (is(value, SQL)) {
      if (this.config.sqlBehavior === "sql") {
        return value;
      }
      throw new Error(
        `You tried to reference "${prop}" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.`
      );
    }
    if (is(value, Column)) {
      if (this.config.alias) {
        return new Proxy(
          value,
          new ColumnAliasProxyHandler(
            new Proxy(
              value.table,
              new TableAliasProxyHandler(this.config.alias, this.config.replaceOriginalName ?? false)
            )
          )
        );
      }
      return value;
    }
    if (typeof value !== "object" || value === null) {
      return value;
    }
    return new Proxy(value, new _SelectionProxyHandler(this.config));
  }
};

// node_modules/drizzle-orm/pg-core/query-builders/delete.js
var PgDeleteBase = class extends QueryPromise {
  constructor(table, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, withList };
  }
  static [entityKind] = "PgDelete";
  config;
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will delete only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be deleted.
   *
   * ```ts
   * // Delete all cars with green color
   * await db.delete(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.delete(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Delete all BMW cars with a green color
   * await db.delete(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Delete all cars with the green or blue color
   * await db.delete(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  returning(fields = this.config.table[Table.Symbol.Columns]) {
    this.config.returningFields = fields;
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildDeleteQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name, true);
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
  /** @internal */
  getSelectedFields() {
    return this.config.returningFields ? new Proxy(
      this.config.returningFields,
      new SelectionProxyHandler({
        alias: getTableName(this.config.table),
        sqlAliasedBehavior: "alias",
        sqlBehavior: "error"
      })
    ) : void 0;
  }
  $dynamic() {
    return this;
  }
};

// node_modules/drizzle-orm/casing.js
function toSnakeCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.map((word) => word.toLowerCase()).join("_");
}
function toCamelCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.reduce((acc, word, i) => {
    const formattedWord = i === 0 ? word.toLowerCase() : `${word[0].toUpperCase()}${word.slice(1)}`;
    return acc + formattedWord;
  }, "");
}
function noopCase(input) {
  return input;
}
var CasingCache = class {
  static [entityKind] = "CasingCache";
  /** @internal */
  cache = {};
  cachedTables = {};
  convert;
  constructor(casing) {
    this.convert = casing === "snake_case" ? toSnakeCase : casing === "camelCase" ? toCamelCase : noopCase;
  }
  getColumnCasing(column) {
    if (!column.keyAsName)
      return column.name;
    const schema = column.table[Table.Symbol.Schema] ?? "public";
    const tableName = column.table[Table.Symbol.OriginalName];
    const key = `${schema}.${tableName}.${column.name}`;
    if (!this.cache[key]) {
      this.cacheTable(column.table);
    }
    return this.cache[key];
  }
  cacheTable(table) {
    const schema = table[Table.Symbol.Schema] ?? "public";
    const tableName = table[Table.Symbol.OriginalName];
    const tableKey = `${schema}.${tableName}`;
    if (!this.cachedTables[tableKey]) {
      for (const column of Object.values(table[Table.Symbol.Columns])) {
        const columnKey = `${tableKey}.${column.name}`;
        this.cache[columnKey] = this.convert(column.name);
      }
      this.cachedTables[tableKey] = true;
    }
  }
  clearCache() {
    this.cache = {};
    this.cachedTables = {};
  }
};

// node_modules/drizzle-orm/pg-core/view-base.js
var PgViewBase = class extends View {
  static [entityKind] = "PgViewBase";
};

// node_modules/drizzle-orm/pg-core/dialect.js
var PgDialect = class {
  static [entityKind] = "PgDialect";
  /** @internal */
  casing;
  constructor(config) {
    this.casing = new CasingCache(config?.casing);
  }
  async migrate(migrations, session, config) {
    const migrationsTable = typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
    const migrationsSchema = typeof config === "string" ? "drizzle" : config.migrationsSchema ?? "drizzle";
    const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsSchema)}.${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at bigint
			)
		`;
    await session.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(migrationsSchema)}`);
    await session.execute(migrationTableCreate);
    const dbMigrations = await session.all(
      sql`select id, hash, created_at from ${sql.identifier(migrationsSchema)}.${sql.identifier(migrationsTable)} order by created_at desc limit 1`
    );
    const lastDbMigration = dbMigrations[0];
    await session.transaction(async (tx) => {
      for await (const migration of migrations) {
        if (!lastDbMigration || Number(lastDbMigration.created_at) < migration.folderMillis) {
          for (const stmt of migration.sql) {
            await tx.execute(sql.raw(stmt));
          }
          await tx.execute(
            sql`insert into ${sql.identifier(migrationsSchema)}.${sql.identifier(migrationsTable)} ("hash", "created_at") values(${migration.hash}, ${migration.folderMillis})`
          );
        }
      }
    });
  }
  escapeName(name) {
    return `"${name}"`;
  }
  escapeParam(num) {
    return `$${num + 1}`;
  }
  escapeString(str2) {
    return `'${str2.replace(/'/g, "''")}'`;
  }
  buildWithCTE(queries) {
    if (!queries?.length)
      return void 0;
    const withSqlChunks = [sql`with `];
    for (const [i, w] of queries.entries()) {
      withSqlChunks.push(sql`${sql.identifier(w._.alias)} as (${w._.sql})`);
      if (i < queries.length - 1) {
        withSqlChunks.push(sql`, `);
      }
    }
    withSqlChunks.push(sql` `);
    return sql.join(withSqlChunks);
  }
  buildDeleteQuery({ table, where, returning, withList }) {
    const withSql = this.buildWithCTE(withList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    return sql`${withSql}delete from ${table}${whereSql}${returningSql}`;
  }
  buildUpdateSet(table, set) {
    const tableColumns = table[Table.Symbol.Columns];
    const columnNames = Object.keys(tableColumns).filter(
      (colName) => set[colName] !== void 0 || tableColumns[colName]?.onUpdateFn !== void 0
    );
    const setSize = columnNames.length;
    return sql.join(columnNames.flatMap((colName, i) => {
      const col = tableColumns[colName];
      const value = set[colName] ?? sql.param(col.onUpdateFn(), col);
      const res = sql`${sql.identifier(this.casing.getColumnCasing(col))} = ${value}`;
      if (i < setSize - 1) {
        return [res, sql.raw(", ")];
      }
      return [res];
    }));
  }
  buildUpdateQuery({ table, set, where, returning, withList, from, joins }) {
    const withSql = this.buildWithCTE(withList);
    const tableName = table[PgTable.Symbol.Name];
    const tableSchema = table[PgTable.Symbol.Schema];
    const origTableName = table[PgTable.Symbol.OriginalName];
    const alias = tableName === origTableName ? void 0 : tableName;
    const tableSql = sql`${tableSchema ? sql`${sql.identifier(tableSchema)}.` : void 0}${sql.identifier(origTableName)}${alias && sql` ${sql.identifier(alias)}`}`;
    const setSql = this.buildUpdateSet(table, set);
    const fromSql = from && sql.join([sql.raw(" from "), this.buildFromTable(from)]);
    const joinsSql = this.buildJoins(joins);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: !from })}` : void 0;
    const whereSql = where ? sql` where ${where}` : void 0;
    return sql`${withSql}update ${tableSql} set ${setSql}${fromSql}${joinsSql}${whereSql}${returningSql}`;
  }
  /**
   * Builds selection SQL with provided fields/expressions
   *
   * Examples:
   *
   * `select <selection> from`
   *
   * `insert ... returning <selection>`
   *
   * If `isSingleTable` is true, then columns won't be prefixed with table name
   */
  buildSelection(fields, { isSingleTable = false } = {}) {
    const columnsLen = fields.length;
    const chunks = fields.flatMap(({ field }, i) => {
      const chunk = [];
      if (is(field, SQL.Aliased) && field.isSelectionField) {
        chunk.push(sql.identifier(field.fieldAlias));
      } else if (is(field, SQL.Aliased) || is(field, SQL)) {
        const query = is(field, SQL.Aliased) ? field.sql : field;
        if (isSingleTable) {
          chunk.push(
            new SQL(
              query.queryChunks.map((c) => {
                if (is(c, PgColumn)) {
                  return sql.identifier(this.casing.getColumnCasing(c));
                }
                return c;
              })
            )
          );
        } else {
          chunk.push(query);
        }
        if (is(field, SQL.Aliased)) {
          chunk.push(sql` as ${sql.identifier(field.fieldAlias)}`);
        }
      } else if (is(field, Column)) {
        if (isSingleTable) {
          chunk.push(sql.identifier(this.casing.getColumnCasing(field)));
        } else {
          chunk.push(field);
        }
      }
      if (i < columnsLen - 1) {
        chunk.push(sql`, `);
      }
      return chunk;
    });
    return sql.join(chunks);
  }
  buildJoins(joins) {
    if (!joins || joins.length === 0) {
      return void 0;
    }
    const joinsArray = [];
    for (const [index, joinMeta] of joins.entries()) {
      if (index === 0) {
        joinsArray.push(sql` `);
      }
      const table = joinMeta.table;
      const lateralSql = joinMeta.lateral ? sql` lateral` : void 0;
      if (is(table, PgTable)) {
        const tableName = table[PgTable.Symbol.Name];
        const tableSchema = table[PgTable.Symbol.Schema];
        const origTableName = table[PgTable.Symbol.OriginalName];
        const alias = tableName === origTableName ? void 0 : joinMeta.alias;
        joinsArray.push(
          sql`${sql.raw(joinMeta.joinType)} join${lateralSql} ${tableSchema ? sql`${sql.identifier(tableSchema)}.` : void 0}${sql.identifier(origTableName)}${alias && sql` ${sql.identifier(alias)}`} on ${joinMeta.on}`
        );
      } else if (is(table, View)) {
        const viewName = table[ViewBaseConfig].name;
        const viewSchema = table[ViewBaseConfig].schema;
        const origViewName = table[ViewBaseConfig].originalName;
        const alias = viewName === origViewName ? void 0 : joinMeta.alias;
        joinsArray.push(
          sql`${sql.raw(joinMeta.joinType)} join${lateralSql} ${viewSchema ? sql`${sql.identifier(viewSchema)}.` : void 0}${sql.identifier(origViewName)}${alias && sql` ${sql.identifier(alias)}`} on ${joinMeta.on}`
        );
      } else {
        joinsArray.push(
          sql`${sql.raw(joinMeta.joinType)} join${lateralSql} ${table} on ${joinMeta.on}`
        );
      }
      if (index < joins.length - 1) {
        joinsArray.push(sql` `);
      }
    }
    return sql.join(joinsArray);
  }
  buildFromTable(table) {
    if (is(table, Table) && table[Table.Symbol.OriginalName] !== table[Table.Symbol.Name]) {
      let fullName = sql`${sql.identifier(table[Table.Symbol.OriginalName])}`;
      if (table[Table.Symbol.Schema]) {
        fullName = sql`${sql.identifier(table[Table.Symbol.Schema])}.${fullName}`;
      }
      return sql`${fullName} ${sql.identifier(table[Table.Symbol.Name])}`;
    }
    return table;
  }
  buildSelectQuery({
    withList,
    fields,
    fieldsFlat,
    where,
    having,
    table,
    joins,
    orderBy,
    groupBy,
    limit: limit2,
    offset,
    lockingClause,
    distinct,
    setOperators
  }) {
    const fieldsList = fieldsFlat ?? orderSelectedFields(fields);
    for (const f of fieldsList) {
      if (is(f.field, Column) && getTableName(f.field.table) !== (is(table, Subquery) ? table._.alias : is(table, PgViewBase) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : getTableName(table)) && !((table2) => joins?.some(
        ({ alias }) => alias === (table2[Table.Symbol.IsAlias] ? getTableName(table2) : table2[Table.Symbol.BaseName])
      ))(f.field.table)) {
        const tableName = getTableName(f.field.table);
        throw new Error(
          `Your "${f.path.join("->")}" field references a column "${tableName}"."${f.field.name}", but the table "${tableName}" is not part of the query! Did you forget to join it?`
        );
      }
    }
    const isSingleTable = !joins || joins.length === 0;
    const withSql = this.buildWithCTE(withList);
    let distinctSql;
    if (distinct) {
      distinctSql = distinct === true ? sql` distinct` : sql` distinct on (${sql.join(distinct.on, sql`, `)})`;
    }
    const selection = this.buildSelection(fieldsList, { isSingleTable });
    const tableSql = this.buildFromTable(table);
    const joinsSql = this.buildJoins(joins);
    const whereSql = where ? sql` where ${where}` : void 0;
    const havingSql = having ? sql` having ${having}` : void 0;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      orderBySql = sql` order by ${sql.join(orderBy, sql`, `)}`;
    }
    let groupBySql;
    if (groupBy && groupBy.length > 0) {
      groupBySql = sql` group by ${sql.join(groupBy, sql`, `)}`;
    }
    const limitSql = typeof limit2 === "object" || typeof limit2 === "number" && limit2 >= 0 ? sql` limit ${limit2}` : void 0;
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    const lockingClauseSql = sql.empty();
    if (lockingClause) {
      const clauseSql = sql` for ${sql.raw(lockingClause.strength)}`;
      if (lockingClause.config.of) {
        clauseSql.append(
          sql` of ${sql.join(
            Array.isArray(lockingClause.config.of) ? lockingClause.config.of : [lockingClause.config.of],
            sql`, `
          )}`
        );
      }
      if (lockingClause.config.noWait) {
        clauseSql.append(sql` no wait`);
      } else if (lockingClause.config.skipLocked) {
        clauseSql.append(sql` skip locked`);
      }
      lockingClauseSql.append(clauseSql);
    }
    const finalQuery = sql`${withSql}select${distinctSql} ${selection} from ${tableSql}${joinsSql}${whereSql}${groupBySql}${havingSql}${orderBySql}${limitSql}${offsetSql}${lockingClauseSql}`;
    if (setOperators.length > 0) {
      return this.buildSetOperations(finalQuery, setOperators);
    }
    return finalQuery;
  }
  buildSetOperations(leftSelect, setOperators) {
    const [setOperator, ...rest] = setOperators;
    if (!setOperator) {
      throw new Error("Cannot pass undefined values to any set operator");
    }
    if (rest.length === 0) {
      return this.buildSetOperationQuery({ leftSelect, setOperator });
    }
    return this.buildSetOperations(
      this.buildSetOperationQuery({ leftSelect, setOperator }),
      rest
    );
  }
  buildSetOperationQuery({
    leftSelect,
    setOperator: { type, isAll, rightSelect, limit: limit2, orderBy, offset }
  }) {
    const leftChunk = sql`(${leftSelect.getSQL()}) `;
    const rightChunk = sql`(${rightSelect.getSQL()})`;
    let orderBySql;
    if (orderBy && orderBy.length > 0) {
      const orderByValues = [];
      for (const singleOrderBy of orderBy) {
        if (is(singleOrderBy, PgColumn)) {
          orderByValues.push(sql.identifier(singleOrderBy.name));
        } else if (is(singleOrderBy, SQL)) {
          for (let i = 0; i < singleOrderBy.queryChunks.length; i++) {
            const chunk = singleOrderBy.queryChunks[i];
            if (is(chunk, PgColumn)) {
              singleOrderBy.queryChunks[i] = sql.identifier(chunk.name);
            }
          }
          orderByValues.push(sql`${singleOrderBy}`);
        } else {
          orderByValues.push(sql`${singleOrderBy}`);
        }
      }
      orderBySql = sql` order by ${sql.join(orderByValues, sql`, `)} `;
    }
    const limitSql = typeof limit2 === "object" || typeof limit2 === "number" && limit2 >= 0 ? sql` limit ${limit2}` : void 0;
    const operatorChunk = sql.raw(`${type} ${isAll ? "all " : ""}`);
    const offsetSql = offset ? sql` offset ${offset}` : void 0;
    return sql`${leftChunk}${operatorChunk}${rightChunk}${orderBySql}${limitSql}${offsetSql}`;
  }
  buildInsertQuery({ table, values: valuesOrSelect, onConflict, returning, withList, select, overridingSystemValue_ }) {
    const valuesSqlList = [];
    const columns = table[Table.Symbol.Columns];
    const colEntries = Object.entries(columns).filter(([_, col]) => !col.shouldDisableInsert());
    const insertOrder = colEntries.map(
      ([, column]) => sql.identifier(this.casing.getColumnCasing(column))
    );
    if (select) {
      const select2 = valuesOrSelect;
      if (is(select2, SQL)) {
        valuesSqlList.push(select2);
      } else {
        valuesSqlList.push(select2.getSQL());
      }
    } else {
      const values = valuesOrSelect;
      valuesSqlList.push(sql.raw("values "));
      for (const [valueIndex, value] of values.entries()) {
        const valueList = [];
        for (const [fieldName, col] of colEntries) {
          const colValue = value[fieldName];
          if (colValue === void 0 || is(colValue, Param) && colValue.value === void 0) {
            if (col.defaultFn !== void 0) {
              const defaultFnResult = col.defaultFn();
              const defaultValue = is(defaultFnResult, SQL) ? defaultFnResult : sql.param(defaultFnResult, col);
              valueList.push(defaultValue);
            } else if (!col.default && col.onUpdateFn !== void 0) {
              const onUpdateFnResult = col.onUpdateFn();
              const newValue = is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col);
              valueList.push(newValue);
            } else {
              valueList.push(sql`default`);
            }
          } else {
            valueList.push(colValue);
          }
        }
        valuesSqlList.push(valueList);
        if (valueIndex < values.length - 1) {
          valuesSqlList.push(sql`, `);
        }
      }
    }
    const withSql = this.buildWithCTE(withList);
    const valuesSql = sql.join(valuesSqlList);
    const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
    const onConflictSql = onConflict ? sql` on conflict ${onConflict}` : void 0;
    const overridingSql = overridingSystemValue_ === true ? sql`overriding system value ` : void 0;
    return sql`${withSql}insert into ${table} ${insertOrder} ${overridingSql}${valuesSql}${onConflictSql}${returningSql}`;
  }
  buildRefreshMaterializedViewQuery({ view, concurrently, withNoData }) {
    const concurrentlySql = concurrently ? sql` concurrently` : void 0;
    const withNoDataSql = withNoData ? sql` with no data` : void 0;
    return sql`refresh materialized view${concurrentlySql} ${view}${withNoDataSql}`;
  }
  prepareTyping(encoder) {
    if (is(encoder, PgJsonb) || is(encoder, PgJson)) {
      return "json";
    } else if (is(encoder, PgNumeric)) {
      return "decimal";
    } else if (is(encoder, PgTime)) {
      return "time";
    } else if (is(encoder, PgTimestamp) || is(encoder, PgTimestampString)) {
      return "timestamp";
    } else if (is(encoder, PgDate) || is(encoder, PgDateString)) {
      return "date";
    } else if (is(encoder, PgUUID)) {
      return "uuid";
    } else {
      return "none";
    }
  }
  sqlToQuery(sql2, invokeSource) {
    return sql2.toQuery({
      casing: this.casing,
      escapeName: this.escapeName,
      escapeParam: this.escapeParam,
      escapeString: this.escapeString,
      prepareTyping: this.prepareTyping,
      invokeSource
    });
  }
  // buildRelationalQueryWithPK({
  // 	fullSchema,
  // 	schema,
  // 	tableNamesMap,
  // 	table,
  // 	tableConfig,
  // 	queryConfig: config,
  // 	tableAlias,
  // 	isRoot = false,
  // 	joinOn,
  // }: {
  // 	fullSchema: Record<string, unknown>;
  // 	schema: TablesRelationalConfig;
  // 	tableNamesMap: Record<string, string>;
  // 	table: PgTable;
  // 	tableConfig: TableRelationalConfig;
  // 	queryConfig: true | DBQueryConfig<'many', true>;
  // 	tableAlias: string;
  // 	isRoot?: boolean;
  // 	joinOn?: SQL;
  // }): BuildRelationalQueryResult<PgTable, PgColumn> {
  // 	// For { "<relation>": true }, return a table with selection of all columns
  // 	if (config === true) {
  // 		const selectionEntries = Object.entries(tableConfig.columns);
  // 		const selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = selectionEntries.map((
  // 			[key, value],
  // 		) => ({
  // 			dbKey: value.name,
  // 			tsKey: key,
  // 			field: value as PgColumn,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 		return {
  // 			tableTsKey: tableConfig.tsName,
  // 			sql: table,
  // 			selection,
  // 		};
  // 	}
  // 	// let selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = [];
  // 	// let selectionForBuild = selection;
  // 	const aliasedColumns = Object.fromEntries(
  // 		Object.entries(tableConfig.columns).map(([key, value]) => [key, aliasedTableColumn(value, tableAlias)]),
  // 	);
  // 	const aliasedRelations = Object.fromEntries(
  // 		Object.entries(tableConfig.relations).map(([key, value]) => [key, aliasedRelation(value, tableAlias)]),
  // 	);
  // 	const aliasedFields = Object.assign({}, aliasedColumns, aliasedRelations);
  // 	let where, hasUserDefinedWhere;
  // 	if (config.where) {
  // 		const whereSql = typeof config.where === 'function' ? config.where(aliasedFields, operators) : config.where;
  // 		where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
  // 		hasUserDefinedWhere = !!where;
  // 	}
  // 	where = and(joinOn, where);
  // 	// const fieldsSelection: { tsKey: string; value: PgColumn | SQL.Aliased; isExtra?: boolean }[] = [];
  // 	let joins: Join[] = [];
  // 	let selectedColumns: string[] = [];
  // 	// Figure out which columns to select
  // 	if (config.columns) {
  // 		let isIncludeMode = false;
  // 		for (const [field, value] of Object.entries(config.columns)) {
  // 			if (value === undefined) {
  // 				continue;
  // 			}
  // 			if (field in tableConfig.columns) {
  // 				if (!isIncludeMode && value === true) {
  // 					isIncludeMode = true;
  // 				}
  // 				selectedColumns.push(field);
  // 			}
  // 		}
  // 		if (selectedColumns.length > 0) {
  // 			selectedColumns = isIncludeMode
  // 				? selectedColumns.filter((c) => config.columns?.[c] === true)
  // 				: Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
  // 		}
  // 	} else {
  // 		// Select all columns if selection is not specified
  // 		selectedColumns = Object.keys(tableConfig.columns);
  // 	}
  // 	// for (const field of selectedColumns) {
  // 	// 	const column = tableConfig.columns[field]! as PgColumn;
  // 	// 	fieldsSelection.push({ tsKey: field, value: column });
  // 	// }
  // 	let initiallySelectedRelations: {
  // 		tsKey: string;
  // 		queryConfig: true | DBQueryConfig<'many', false>;
  // 		relation: Relation;
  // 	}[] = [];
  // 	// let selectedRelations: BuildRelationalQueryResult<PgTable, PgColumn>['selection'] = [];
  // 	// Figure out which relations to select
  // 	if (config.with) {
  // 		initiallySelectedRelations = Object.entries(config.with)
  // 			.filter((entry): entry is [typeof entry[0], NonNullable<typeof entry[1]>] => !!entry[1])
  // 			.map(([tsKey, queryConfig]) => ({ tsKey, queryConfig, relation: tableConfig.relations[tsKey]! }));
  // 	}
  // 	const manyRelations = initiallySelectedRelations.filter((r) =>
  // 		is(r.relation, Many)
  // 		&& (schema[tableNamesMap[r.relation.referencedTable[Table.Symbol.Name]]!]?.primaryKey.length ?? 0) > 0
  // 	);
  // 	// If this is the last Many relation (or there are no Many relations), we are on the innermost subquery level
  // 	const isInnermostQuery = manyRelations.length < 2;
  // 	const selectedExtras: {
  // 		tsKey: string;
  // 		value: SQL.Aliased;
  // 	}[] = [];
  // 	// Figure out which extras to select
  // 	if (isInnermostQuery && config.extras) {
  // 		const extras = typeof config.extras === 'function'
  // 			? config.extras(aliasedFields, { sql })
  // 			: config.extras;
  // 		for (const [tsKey, value] of Object.entries(extras)) {
  // 			selectedExtras.push({
  // 				tsKey,
  // 				value: mapColumnsInAliasedSQLToAlias(value, tableAlias),
  // 			});
  // 		}
  // 	}
  // 	// Transform `fieldsSelection` into `selection`
  // 	// `fieldsSelection` shouldn't be used after this point
  // 	// for (const { tsKey, value, isExtra } of fieldsSelection) {
  // 	// 	selection.push({
  // 	// 		dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey]!.name,
  // 	// 		tsKey,
  // 	// 		field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
  // 	// 		relationTableTsKey: undefined,
  // 	// 		isJson: false,
  // 	// 		isExtra,
  // 	// 		selection: [],
  // 	// 	});
  // 	// }
  // 	let orderByOrig = typeof config.orderBy === 'function'
  // 		? config.orderBy(aliasedFields, orderByOperators)
  // 		: config.orderBy ?? [];
  // 	if (!Array.isArray(orderByOrig)) {
  // 		orderByOrig = [orderByOrig];
  // 	}
  // 	const orderBy = orderByOrig.map((orderByValue) => {
  // 		if (is(orderByValue, Column)) {
  // 			return aliasedTableColumn(orderByValue, tableAlias) as PgColumn;
  // 		}
  // 		return mapColumnsInSQLToAlias(orderByValue, tableAlias);
  // 	});
  // 	const limit = isInnermostQuery ? config.limit : undefined;
  // 	const offset = isInnermostQuery ? config.offset : undefined;
  // 	// For non-root queries without additional config except columns, return a table with selection
  // 	if (
  // 		!isRoot
  // 		&& initiallySelectedRelations.length === 0
  // 		&& selectedExtras.length === 0
  // 		&& !where
  // 		&& orderBy.length === 0
  // 		&& limit === undefined
  // 		&& offset === undefined
  // 	) {
  // 		return {
  // 			tableTsKey: tableConfig.tsName,
  // 			sql: table,
  // 			selection: selectedColumns.map((key) => ({
  // 				dbKey: tableConfig.columns[key]!.name,
  // 				tsKey: key,
  // 				field: tableConfig.columns[key] as PgColumn,
  // 				relationTableTsKey: undefined,
  // 				isJson: false,
  // 				selection: [],
  // 			})),
  // 		};
  // 	}
  // 	const selectedRelationsWithoutPK:
  // 	// Process all relations without primary keys, because they need to be joined differently and will all be on the same query level
  // 	for (
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationConfigValue,
  // 			relation,
  // 		} of initiallySelectedRelations
  // 	) {
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTable = schema[relationTableTsName]!;
  // 		if (relationTable.primaryKey.length > 0) {
  // 			continue;
  // 		}
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelation = this.buildRelationalQueryWithoutPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationConfigValue,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 			nestedQueryRelation: relation,
  // 		});
  // 		const field = sql`${sql.identifier(relationTableAlias)}.${sql.identifier('data')}`.as(selectedRelationTsKey);
  // 		joins.push({
  // 			on: sql`true`,
  // 			table: new Subquery(builtRelation.sql as SQL, {}, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: true,
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelation.selection,
  // 		});
  // 	}
  // 	const oneRelations = initiallySelectedRelations.filter((r): r is typeof r & { relation: One } =>
  // 		is(r.relation, One)
  // 	);
  // 	// Process all One relations with PKs, because they can all be joined on the same level
  // 	for (
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationConfigValue,
  // 			relation,
  // 		} of oneRelations
  // 	) {
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const relationTable = schema[relationTableTsName]!;
  // 		if (relationTable.primaryKey.length === 0) {
  // 			continue;
  // 		}
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelation = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationConfigValue,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 		});
  // 		const field = sql`case when ${sql.identifier(relationTableAlias)} is null then null else json_build_array(${
  // 			sql.join(
  // 				builtRelation.selection.map(({ field }) =>
  // 					is(field, SQL.Aliased)
  // 						? sql`${sql.identifier(relationTableAlias)}.${sql.identifier(field.fieldAlias)}`
  // 						: is(field, Column)
  // 						? aliasedTableColumn(field, relationTableAlias)
  // 						: field
  // 				),
  // 				sql`, `,
  // 			)
  // 		}) end`.as(selectedRelationTsKey);
  // 		const isLateralJoin = is(builtRelation.sql, SQL);
  // 		joins.push({
  // 			on: isLateralJoin ? sql`true` : joinOn,
  // 			table: is(builtRelation.sql, SQL)
  // 				? new Subquery(builtRelation.sql, {}, relationTableAlias)
  // 				: aliasedTable(builtRelation.sql, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: is(builtRelation.sql, SQL),
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelation.selection,
  // 		});
  // 	}
  // 	let distinct: PgSelectConfig['distinct'];
  // 	let tableFrom: PgTable | Subquery = table;
  // 	// Process first Many relation - each one requires a nested subquery
  // 	const manyRelation = manyRelations[0];
  // 	if (manyRelation) {
  // 		const {
  // 			tsKey: selectedRelationTsKey,
  // 			queryConfig: selectedRelationQueryConfig,
  // 			relation,
  // 		} = manyRelation;
  // 		distinct = {
  // 			on: tableConfig.primaryKey.map((c) => aliasedTableColumn(c as PgColumn, tableAlias)),
  // 		};
  // 		const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
  // 		const relationTableName = relation.referencedTable[Table.Symbol.Name];
  // 		const relationTableTsName = tableNamesMap[relationTableName]!;
  // 		const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
  // 		const joinOn = and(
  // 			...normalizedRelation.fields.map((field, i) =>
  // 				eq(
  // 					aliasedTableColumn(normalizedRelation.references[i]!, relationTableAlias),
  // 					aliasedTableColumn(field, tableAlias),
  // 				)
  // 			),
  // 		);
  // 		const builtRelationJoin = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table: fullSchema[relationTableTsName] as PgTable,
  // 			tableConfig: schema[relationTableTsName]!,
  // 			queryConfig: selectedRelationQueryConfig,
  // 			tableAlias: relationTableAlias,
  // 			joinOn,
  // 		});
  // 		const builtRelationSelectionField = sql`case when ${
  // 			sql.identifier(relationTableAlias)
  // 		} is null then '[]' else json_agg(json_build_array(${
  // 			sql.join(
  // 				builtRelationJoin.selection.map(({ field }) =>
  // 					is(field, SQL.Aliased)
  // 						? sql`${sql.identifier(relationTableAlias)}.${sql.identifier(field.fieldAlias)}`
  // 						: is(field, Column)
  // 						? aliasedTableColumn(field, relationTableAlias)
  // 						: field
  // 				),
  // 				sql`, `,
  // 			)
  // 		})) over (partition by ${sql.join(distinct.on, sql`, `)}) end`.as(selectedRelationTsKey);
  // 		const isLateralJoin = is(builtRelationJoin.sql, SQL);
  // 		joins.push({
  // 			on: isLateralJoin ? sql`true` : joinOn,
  // 			table: isLateralJoin
  // 				? new Subquery(builtRelationJoin.sql as SQL, {}, relationTableAlias)
  // 				: aliasedTable(builtRelationJoin.sql as PgTable, relationTableAlias),
  // 			alias: relationTableAlias,
  // 			joinType: 'left',
  // 			lateral: isLateralJoin,
  // 		});
  // 		// Build the "from" subquery with the remaining Many relations
  // 		const builtTableFrom = this.buildRelationalQueryWithPK({
  // 			fullSchema,
  // 			schema,
  // 			tableNamesMap,
  // 			table,
  // 			tableConfig,
  // 			queryConfig: {
  // 				...config,
  // 				where: undefined,
  // 				orderBy: undefined,
  // 				limit: undefined,
  // 				offset: undefined,
  // 				with: manyRelations.slice(1).reduce<NonNullable<typeof config['with']>>(
  // 					(result, { tsKey, queryConfig: configValue }) => {
  // 						result[tsKey] = configValue;
  // 						return result;
  // 					},
  // 					{},
  // 				),
  // 			},
  // 			tableAlias,
  // 		});
  // 		selectedRelations.push({
  // 			dbKey: selectedRelationTsKey,
  // 			tsKey: selectedRelationTsKey,
  // 			field: builtRelationSelectionField,
  // 			relationTableTsKey: relationTableTsName,
  // 			isJson: true,
  // 			selection: builtRelationJoin.selection,
  // 		});
  // 		// selection = builtTableFrom.selection.map((item) =>
  // 		// 	is(item.field, SQL.Aliased)
  // 		// 		? { ...item, field: sql`${sql.identifier(tableAlias)}.${sql.identifier(item.field.fieldAlias)}` }
  // 		// 		: item
  // 		// );
  // 		// selectionForBuild = [{
  // 		// 	dbKey: '*',
  // 		// 	tsKey: '*',
  // 		// 	field: sql`${sql.identifier(tableAlias)}.*`,
  // 		// 	selection: [],
  // 		// 	isJson: false,
  // 		// 	relationTableTsKey: undefined,
  // 		// }];
  // 		// const newSelectionItem: (typeof selection)[number] = {
  // 		// 	dbKey: selectedRelationTsKey,
  // 		// 	tsKey: selectedRelationTsKey,
  // 		// 	field,
  // 		// 	relationTableTsKey: relationTableTsName,
  // 		// 	isJson: true,
  // 		// 	selection: builtRelationJoin.selection,
  // 		// };
  // 		// selection.push(newSelectionItem);
  // 		// selectionForBuild.push(newSelectionItem);
  // 		tableFrom = is(builtTableFrom.sql, PgTable)
  // 			? builtTableFrom.sql
  // 			: new Subquery(builtTableFrom.sql, {}, tableAlias);
  // 	}
  // 	if (selectedColumns.length === 0 && selectedRelations.length === 0 && selectedExtras.length === 0) {
  // 		throw new DrizzleError(`No fields selected for table "${tableConfig.tsName}" ("${tableAlias}")`);
  // 	}
  // 	let selection: BuildRelationalQueryResult<PgTable, PgColumn>['selection'];
  // 	function prepareSelectedColumns() {
  // 		return selectedColumns.map((key) => ({
  // 			dbKey: tableConfig.columns[key]!.name,
  // 			tsKey: key,
  // 			field: tableConfig.columns[key] as PgColumn,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 	}
  // 	function prepareSelectedExtras() {
  // 		return selectedExtras.map((item) => ({
  // 			dbKey: item.value.fieldAlias,
  // 			tsKey: item.tsKey,
  // 			field: item.value,
  // 			relationTableTsKey: undefined,
  // 			isJson: false,
  // 			selection: [],
  // 		}));
  // 	}
  // 	if (isRoot) {
  // 		selection = [
  // 			...prepareSelectedColumns(),
  // 			...prepareSelectedExtras(),
  // 		];
  // 	}
  // 	if (hasUserDefinedWhere || orderBy.length > 0) {
  // 		tableFrom = new Subquery(
  // 			this.buildSelectQuery({
  // 				table: is(tableFrom, PgTable) ? aliasedTable(tableFrom, tableAlias) : tableFrom,
  // 				fields: {},
  // 				fieldsFlat: selectionForBuild.map(({ field }) => ({
  // 					path: [],
  // 					field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field,
  // 				})),
  // 				joins,
  // 				distinct,
  // 			}),
  // 			{},
  // 			tableAlias,
  // 		);
  // 		selectionForBuild = selection.map((item) =>
  // 			is(item.field, SQL.Aliased)
  // 				? { ...item, field: sql`${sql.identifier(tableAlias)}.${sql.identifier(item.field.fieldAlias)}` }
  // 				: item
  // 		);
  // 		joins = [];
  // 		distinct = undefined;
  // 	}
  // 	const result = this.buildSelectQuery({
  // 		table: is(tableFrom, PgTable) ? aliasedTable(tableFrom, tableAlias) : tableFrom,
  // 		fields: {},
  // 		fieldsFlat: selectionForBuild.map(({ field }) => ({
  // 			path: [],
  // 			field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field,
  // 		})),
  // 		where,
  // 		limit,
  // 		offset,
  // 		joins,
  // 		orderBy,
  // 		distinct,
  // 	});
  // 	return {
  // 		tableTsKey: tableConfig.tsName,
  // 		sql: result,
  // 		selection,
  // 	};
  // }
  buildRelationalQueryWithoutPK({
    fullSchema,
    schema,
    tableNamesMap,
    table,
    tableConfig,
    queryConfig: config,
    tableAlias,
    nestedQueryRelation,
    joinOn
  }) {
    let selection = [];
    let limit2, offset, orderBy = [], where;
    const joins = [];
    if (config === true) {
      const selectionEntries = Object.entries(tableConfig.columns);
      selection = selectionEntries.map(([key, value]) => ({
        dbKey: value.name,
        tsKey: key,
        field: aliasedTableColumn(value, tableAlias),
        relationTableTsKey: void 0,
        isJson: false,
        selection: []
      }));
    } else {
      const aliasedColumns = Object.fromEntries(
        Object.entries(tableConfig.columns).map(([key, value]) => [key, aliasedTableColumn(value, tableAlias)])
      );
      if (config.where) {
        const whereSql = typeof config.where === "function" ? config.where(aliasedColumns, getOperators()) : config.where;
        where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
      }
      const fieldsSelection = [];
      let selectedColumns = [];
      if (config.columns) {
        let isIncludeMode = false;
        for (const [field, value] of Object.entries(config.columns)) {
          if (value === void 0) {
            continue;
          }
          if (field in tableConfig.columns) {
            if (!isIncludeMode && value === true) {
              isIncludeMode = true;
            }
            selectedColumns.push(field);
          }
        }
        if (selectedColumns.length > 0) {
          selectedColumns = isIncludeMode ? selectedColumns.filter((c) => config.columns?.[c] === true) : Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
        }
      } else {
        selectedColumns = Object.keys(tableConfig.columns);
      }
      for (const field of selectedColumns) {
        const column = tableConfig.columns[field];
        fieldsSelection.push({ tsKey: field, value: column });
      }
      let selectedRelations = [];
      if (config.with) {
        selectedRelations = Object.entries(config.with).filter((entry) => !!entry[1]).map(([tsKey, queryConfig]) => ({ tsKey, queryConfig, relation: tableConfig.relations[tsKey] }));
      }
      let extras;
      if (config.extras) {
        extras = typeof config.extras === "function" ? config.extras(aliasedColumns, { sql }) : config.extras;
        for (const [tsKey, value] of Object.entries(extras)) {
          fieldsSelection.push({
            tsKey,
            value: mapColumnsInAliasedSQLToAlias(value, tableAlias)
          });
        }
      }
      for (const { tsKey, value } of fieldsSelection) {
        selection.push({
          dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey].name,
          tsKey,
          field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
          relationTableTsKey: void 0,
          isJson: false,
          selection: []
        });
      }
      let orderByOrig = typeof config.orderBy === "function" ? config.orderBy(aliasedColumns, getOrderByOperators()) : config.orderBy ?? [];
      if (!Array.isArray(orderByOrig)) {
        orderByOrig = [orderByOrig];
      }
      orderBy = orderByOrig.map((orderByValue) => {
        if (is(orderByValue, Column)) {
          return aliasedTableColumn(orderByValue, tableAlias);
        }
        return mapColumnsInSQLToAlias(orderByValue, tableAlias);
      });
      limit2 = config.limit;
      offset = config.offset;
      for (const {
        tsKey: selectedRelationTsKey,
        queryConfig: selectedRelationConfigValue,
        relation
      } of selectedRelations) {
        const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
        const relationTableName = getTableUniqueName(relation.referencedTable);
        const relationTableTsName = tableNamesMap[relationTableName];
        const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
        const joinOn2 = and(
          ...normalizedRelation.fields.map(
            (field2, i) => eq(
              aliasedTableColumn(normalizedRelation.references[i], relationTableAlias),
              aliasedTableColumn(field2, tableAlias)
            )
          )
        );
        const builtRelation = this.buildRelationalQueryWithoutPK({
          fullSchema,
          schema,
          tableNamesMap,
          table: fullSchema[relationTableTsName],
          tableConfig: schema[relationTableTsName],
          queryConfig: is(relation, One) ? selectedRelationConfigValue === true ? { limit: 1 } : { ...selectedRelationConfigValue, limit: 1 } : selectedRelationConfigValue,
          tableAlias: relationTableAlias,
          joinOn: joinOn2,
          nestedQueryRelation: relation
        });
        const field = sql`${sql.identifier(relationTableAlias)}.${sql.identifier("data")}`.as(selectedRelationTsKey);
        joins.push({
          on: sql`true`,
          table: new Subquery(builtRelation.sql, {}, relationTableAlias),
          alias: relationTableAlias,
          joinType: "left",
          lateral: true
        });
        selection.push({
          dbKey: selectedRelationTsKey,
          tsKey: selectedRelationTsKey,
          field,
          relationTableTsKey: relationTableTsName,
          isJson: true,
          selection: builtRelation.selection
        });
      }
    }
    if (selection.length === 0) {
      throw new DrizzleError({ message: `No fields selected for table "${tableConfig.tsName}" ("${tableAlias}")` });
    }
    let result;
    where = and(joinOn, where);
    if (nestedQueryRelation) {
      let field = sql`json_build_array(${sql.join(
        selection.map(
          ({ field: field2, tsKey, isJson }) => isJson ? sql`${sql.identifier(`${tableAlias}_${tsKey}`)}.${sql.identifier("data")}` : is(field2, SQL.Aliased) ? field2.sql : field2
        ),
        sql`, `
      )})`;
      if (is(nestedQueryRelation, Many)) {
        field = sql`coalesce(json_agg(${field}${orderBy.length > 0 ? sql` order by ${sql.join(orderBy, sql`, `)}` : void 0}), '[]'::json)`;
      }
      const nestedSelection = [{
        dbKey: "data",
        tsKey: "data",
        field: field.as("data"),
        isJson: true,
        relationTableTsKey: tableConfig.tsName,
        selection
      }];
      const needsSubquery = limit2 !== void 0 || offset !== void 0 || orderBy.length > 0;
      if (needsSubquery) {
        result = this.buildSelectQuery({
          table: aliasedTable(table, tableAlias),
          fields: {},
          fieldsFlat: [{
            path: [],
            field: sql.raw("*")
          }],
          where,
          limit: limit2,
          offset,
          orderBy,
          setOperators: []
        });
        where = void 0;
        limit2 = void 0;
        offset = void 0;
        orderBy = [];
      } else {
        result = aliasedTable(table, tableAlias);
      }
      result = this.buildSelectQuery({
        table: is(result, PgTable) ? result : new Subquery(result, {}, tableAlias),
        fields: {},
        fieldsFlat: nestedSelection.map(({ field: field2 }) => ({
          path: [],
          field: is(field2, Column) ? aliasedTableColumn(field2, tableAlias) : field2
        })),
        joins,
        where,
        limit: limit2,
        offset,
        orderBy,
        setOperators: []
      });
    } else {
      result = this.buildSelectQuery({
        table: aliasedTable(table, tableAlias),
        fields: {},
        fieldsFlat: selection.map(({ field }) => ({
          path: [],
          field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field
        })),
        joins,
        where,
        limit: limit2,
        offset,
        orderBy,
        setOperators: []
      });
    }
    return {
      tableTsKey: tableConfig.tsName,
      sql: result,
      selection
    };
  }
};

// node_modules/drizzle-orm/query-builders/query-builder.js
var TypedQueryBuilder = class {
  static [entityKind] = "TypedQueryBuilder";
  /** @internal */
  getSelectedFields() {
    return this._.selectedFields;
  }
};

// node_modules/drizzle-orm/pg-core/query-builders/select.js
var PgSelectBuilder = class {
  static [entityKind] = "PgSelectBuilder";
  fields;
  session;
  dialect;
  withList = [];
  distinct;
  constructor(config) {
    this.fields = config.fields;
    this.session = config.session;
    this.dialect = config.dialect;
    if (config.withList) {
      this.withList = config.withList;
    }
    this.distinct = config.distinct;
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  /**
   * Specify the table, subquery, or other target that you're
   * building a select query against.
   *
   * {@link https://www.postgresql.org/docs/current/sql-select.html#SQL-FROM | Postgres from documentation}
   */
  from(source) {
    const isPartialSelect = !!this.fields;
    const src = source;
    let fields;
    if (this.fields) {
      fields = this.fields;
    } else if (is(src, Subquery)) {
      fields = Object.fromEntries(
        Object.keys(src._.selectedFields).map((key) => [key, src[key]])
      );
    } else if (is(src, PgViewBase)) {
      fields = src[ViewBaseConfig].selectedFields;
    } else if (is(src, SQL)) {
      fields = {};
    } else {
      fields = getTableColumns(src);
    }
    return new PgSelectBase({
      table: src,
      fields,
      isPartialSelect,
      session: this.session,
      dialect: this.dialect,
      withList: this.withList,
      distinct: this.distinct
    }).setToken(this.authToken);
  }
};
var PgSelectQueryBuilderBase = class extends TypedQueryBuilder {
  static [entityKind] = "PgSelectQueryBuilder";
  _;
  config;
  joinsNotNullableMap;
  tableName;
  isPartialSelect;
  session;
  dialect;
  constructor({ table, fields, isPartialSelect, session, dialect, withList, distinct }) {
    super();
    this.config = {
      withList,
      table,
      fields: { ...fields },
      distinct,
      setOperators: []
    };
    this.isPartialSelect = isPartialSelect;
    this.session = session;
    this.dialect = dialect;
    this._ = {
      selectedFields: fields
    };
    this.tableName = getTableLikeName(table);
    this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
  }
  createJoin(joinType) {
    return (table, on) => {
      const baseTableName = this.tableName;
      const tableName = getTableLikeName(table);
      if (typeof tableName === "string" && this.config.joins?.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (!this.isPartialSelect) {
        if (Object.keys(this.joinsNotNullableMap).length === 1 && typeof baseTableName === "string") {
          this.config.fields = {
            [baseTableName]: this.config.fields
          };
        }
        if (typeof tableName === "string" && !is(table, SQL)) {
          const selection = is(table, Subquery) ? table._.selectedFields : is(table, View) ? table[ViewBaseConfig].selectedFields : table[Table.Symbol.Columns];
          this.config.fields[tableName] = selection;
        }
      }
      if (typeof on === "function") {
        on = on(
          new Proxy(
            this.config.fields,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      if (!this.config.joins) {
        this.config.joins = [];
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      if (typeof tableName === "string") {
        switch (joinType) {
          case "left": {
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "inner": {
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
        }
      }
      return this;
    };
  }
  /**
   * Executes a `left join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#left-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet | null }[] = await db.select()
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number | null }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .leftJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  leftJoin = this.createJoin("left");
  /**
   * Executes a `right join` operation by adding another table to the current query.
   *
   * Calling this method associates each row of the joined table with the corresponding row from the main table, if a match is found. If no matching row exists, it sets all columns of the main table to null.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#right-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet }[] = await db.select()
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .rightJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  rightJoin = this.createJoin("right");
  /**
   * Executes an `inner join` operation, creating a new table by combining rows from two tables that have matching values.
   *
   * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User; pets: Pet }[] = await db.select()
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number; petId: number }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .innerJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  innerJoin = this.createJoin("inner");
  /**
   * Executes a `full join` operation by combining rows from two tables into a new table.
   *
   * Calling this method retrieves all rows from both main and joined tables, merging rows with matching values and filling in `null` for non-matching columns.
   *
   * See docs: {@link https://orm.drizzle.team/docs/joins#full-join}
   *
   * @param table the table to join.
   * @param on the `on` clause.
   *
   * @example
   *
   * ```ts
   * // Select all users and their pets
   * const usersWithPets: { user: User | null; pets: Pet | null }[] = await db.select()
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   *
   * // Select userId and petId
   * const usersIdsAndPetIds: { userId: number | null; petId: number | null }[] = await db.select({
   *   userId: users.id,
   *   petId: pets.id,
   * })
   *   .from(users)
   *   .fullJoin(pets, eq(users.id, pets.ownerId))
   * ```
   */
  fullJoin = this.createJoin("full");
  createSetOperator(type, isAll) {
    return (rightSelection) => {
      const rightSelect = typeof rightSelection === "function" ? rightSelection(getPgSetOperators()) : rightSelection;
      if (!haveSameKeys(this.getSelectedFields(), rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
      this.config.setOperators.push({ type, isAll, rightSelect });
      return this;
    };
  }
  /**
   * Adds `union` set operator to the query.
   *
   * Calling this method will combine the result sets of the `select` statements and remove any duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union}
   *
   * @example
   *
   * ```ts
   * // Select all unique names from customers and users tables
   * await db.select({ name: users.name })
   *   .from(users)
   *   .union(
   *     db.select({ name: customers.name }).from(customers)
   *   );
   * // or
   * import { union } from 'drizzle-orm/pg-core'
   *
   * await union(
   *   db.select({ name: users.name }).from(users),
   *   db.select({ name: customers.name }).from(customers)
   * );
   * ```
   */
  union = this.createSetOperator("union", false);
  /**
   * Adds `union all` set operator to the query.
   *
   * Calling this method will combine the result-set of the `select` statements and keep all duplicate rows that appear across them.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#union-all}
   *
   * @example
   *
   * ```ts
   * // Select all transaction ids from both online and in-store sales
   * await db.select({ transaction: onlineSales.transactionId })
   *   .from(onlineSales)
   *   .unionAll(
   *     db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   *   );
   * // or
   * import { unionAll } from 'drizzle-orm/pg-core'
   *
   * await unionAll(
   *   db.select({ transaction: onlineSales.transactionId }).from(onlineSales),
   *   db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
   * );
   * ```
   */
  unionAll = this.createSetOperator("union", true);
  /**
   * Adds `intersect` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets and eliminate duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect}
   *
   * @example
   *
   * ```ts
   * // Select course names that are offered in both departments A and B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .intersect(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { intersect } from 'drizzle-orm/pg-core'
   *
   * await intersect(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  intersect = this.createSetOperator("intersect", false);
  /**
   * Adds `intersect all` set operator to the query.
   *
   * Calling this method will retain only the rows that are present in both result sets including all duplicates.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect-all}
   *
   * @example
   *
   * ```ts
   * // Select all products and quantities that are ordered by both regular and VIP customers
   * await db.select({
   *   productId: regularCustomerOrders.productId,
   *   quantityOrdered: regularCustomerOrders.quantityOrdered
   * })
   * .from(regularCustomerOrders)
   * .intersectAll(
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * // or
   * import { intersectAll } from 'drizzle-orm/pg-core'
   *
   * await intersectAll(
   *   db.select({
   *     productId: regularCustomerOrders.productId,
   *     quantityOrdered: regularCustomerOrders.quantityOrdered
   *   })
   *   .from(regularCustomerOrders),
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * ```
   */
  intersectAll = this.createSetOperator("intersect", true);
  /**
   * Adds `except` set operator to the query.
   *
   * Calling this method will retrieve all unique rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except}
   *
   * @example
   *
   * ```ts
   * // Select all courses offered in department A but not in department B
   * await db.select({ courseName: depA.courseName })
   *   .from(depA)
   *   .except(
   *     db.select({ courseName: depB.courseName }).from(depB)
   *   );
   * // or
   * import { except } from 'drizzle-orm/pg-core'
   *
   * await except(
   *   db.select({ courseName: depA.courseName }).from(depA),
   *   db.select({ courseName: depB.courseName }).from(depB)
   * );
   * ```
   */
  except = this.createSetOperator("except", false);
  /**
   * Adds `except all` set operator to the query.
   *
   * Calling this method will retrieve all rows from the left query, except for the rows that are present in the result set of the right query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/set-operations#except-all}
   *
   * @example
   *
   * ```ts
   * // Select all products that are ordered by regular customers but not by VIP customers
   * await db.select({
   *   productId: regularCustomerOrders.productId,
   *   quantityOrdered: regularCustomerOrders.quantityOrdered,
   * })
   * .from(regularCustomerOrders)
   * .exceptAll(
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered,
   *   })
   *   .from(vipCustomerOrders)
   * );
   * // or
   * import { exceptAll } from 'drizzle-orm/pg-core'
   *
   * await exceptAll(
   *   db.select({
   *     productId: regularCustomerOrders.productId,
   *     quantityOrdered: regularCustomerOrders.quantityOrdered
   *   })
   *   .from(regularCustomerOrders),
   *   db.select({
   *     productId: vipCustomerOrders.productId,
   *     quantityOrdered: vipCustomerOrders.quantityOrdered
   *   })
   *   .from(vipCustomerOrders)
   * );
   * ```
   */
  exceptAll = this.createSetOperator("except", true);
  /** @internal */
  addSetOperators(setOperators) {
    this.config.setOperators.push(...setOperators);
    return this;
  }
  /**
   * Adds a `where` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#filtering}
   *
   * @param where the `where` clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be selected.
   *
   * ```ts
   * // Select all cars with green color
   * await db.select().from(cars).where(eq(cars.color, 'green'));
   * // or
   * await db.select().from(cars).where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Select all BMW cars with a green color
   * await db.select().from(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Select all cars with the green or blue color
   * await db.select().from(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    if (typeof where === "function") {
      where = where(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.where = where;
    return this;
  }
  /**
   * Adds a `having` clause to the query.
   *
   * Calling this method will select only those rows that fulfill a specified condition. It is typically used with aggregate functions to filter the aggregated data based on a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#aggregations}
   *
   * @param having the `having` clause.
   *
   * @example
   *
   * ```ts
   * // Select all brands with more than one car
   * await db.select({
   * 	brand: cars.brand,
   * 	count: sql<number>`cast(count(${cars.id}) as int)`,
   * })
   *   .from(cars)
   *   .groupBy(cars.brand)
   *   .having(({ count }) => gt(count, 1));
   * ```
   */
  having(having) {
    if (typeof having === "function") {
      having = having(
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
        )
      );
    }
    this.config.having = having;
    return this;
  }
  groupBy(...columns) {
    if (typeof columns[0] === "function") {
      const groupBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      this.config.groupBy = Array.isArray(groupBy) ? groupBy : [groupBy];
    } else {
      this.config.groupBy = columns;
    }
    return this;
  }
  orderBy(...columns) {
    if (typeof columns[0] === "function") {
      const orderBy = columns[0](
        new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
        )
      );
      const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    } else {
      const orderByArray = columns;
      if (this.config.setOperators.length > 0) {
        this.config.setOperators.at(-1).orderBy = orderByArray;
      } else {
        this.config.orderBy = orderByArray;
      }
    }
    return this;
  }
  /**
   * Adds a `limit` clause to the query.
   *
   * Calling this method will set the maximum number of rows that will be returned by this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param limit the `limit` clause.
   *
   * @example
   *
   * ```ts
   * // Get the first 10 people from this query.
   * await db.select().from(people).limit(10);
   * ```
   */
  limit(limit2) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).limit = limit2;
    } else {
      this.config.limit = limit2;
    }
    return this;
  }
  /**
   * Adds an `offset` clause to the query.
   *
   * Calling this method will skip a number of rows when returning results from this query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
   *
   * @param offset the `offset` clause.
   *
   * @example
   *
   * ```ts
   * // Get the 10th-20th people from this query.
   * await db.select().from(people).offset(10).limit(10);
   * ```
   */
  offset(offset) {
    if (this.config.setOperators.length > 0) {
      this.config.setOperators.at(-1).offset = offset;
    } else {
      this.config.offset = offset;
    }
    return this;
  }
  /**
   * Adds a `for` clause to the query.
   *
   * Calling this method will specify a lock strength for this query that controls how strictly it acquires exclusive access to the rows being queried.
   *
   * See docs: {@link https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE}
   *
   * @param strength the lock strength.
   * @param config the lock configuration.
   */
  for(strength, config = {}) {
    this.config.lockingClause = { strength, config };
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildSelectQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  as(alias) {
    return new Proxy(
      new Subquery(this.getSQL(), this.config.fields, alias),
      new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  /** @internal */
  getSelectedFields() {
    return new Proxy(
      this.config.fields,
      new SelectionProxyHandler({ alias: this.tableName, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
    );
  }
  $dynamic() {
    return this;
  }
};
var PgSelectBase = class extends PgSelectQueryBuilderBase {
  static [entityKind] = "PgSelect";
  /** @internal */
  _prepare(name) {
    const { session, config, dialect, joinsNotNullableMap, authToken } = this;
    if (!session) {
      throw new Error("Cannot execute a query on a query builder. Please use a database instance instead.");
    }
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      const fieldsList = orderSelectedFields(config.fields);
      const query = session.prepareQuery(dialect.sqlToQuery(this.getSQL()), fieldsList, name, true);
      query.joinsNotNullableMap = joinsNotNullableMap;
      return query.setToken(authToken);
    });
  }
  /**
   * Create a prepared statement for this query. This allows
   * the database to remember this query for the given session
   * and call it by name, rather than specifying the full query.
   *
   * {@link https://www.postgresql.org/docs/current/sql-prepare.html | Postgres prepare documentation}
   */
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
};
applyMixins(PgSelectBase, [QueryPromise]);
function createSetOperator(type, isAll) {
  return (leftSelect, rightSelect, ...restSelects) => {
    const setOperators = [rightSelect, ...restSelects].map((select) => ({
      type,
      isAll,
      rightSelect: select
    }));
    for (const setOperator of setOperators) {
      if (!haveSameKeys(leftSelect.getSelectedFields(), setOperator.rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
    }
    return leftSelect.addSetOperators(setOperators);
  };
}
var getPgSetOperators = () => ({
  union,
  unionAll,
  intersect,
  intersectAll,
  except,
  exceptAll
});
var union = createSetOperator("union", false);
var unionAll = createSetOperator("union", true);
var intersect = createSetOperator("intersect", false);
var intersectAll = createSetOperator("intersect", true);
var except = createSetOperator("except", false);
var exceptAll = createSetOperator("except", true);

// node_modules/drizzle-orm/pg-core/query-builders/query-builder.js
var QueryBuilder = class {
  static [entityKind] = "PgQueryBuilder";
  dialect;
  dialectConfig;
  constructor(dialect) {
    this.dialect = is(dialect, PgDialect) ? dialect : void 0;
    this.dialectConfig = is(dialect, PgDialect) ? void 0 : dialect;
  }
  $with = (alias, selection) => {
    const queryBuilder = this;
    const as = (qb) => {
      if (typeof qb === "function") {
        qb = qb(queryBuilder);
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    };
    return { as };
  };
  with(...queries) {
    const self = this;
    function select(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        distinct: true
      });
    }
    function selectDistinctOn(on, fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: void 0,
        dialect: self.getDialect(),
        distinct: { on }
      });
    }
    return { select, selectDistinct, selectDistinctOn };
  }
  select(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect()
    });
  }
  selectDistinct(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: true
    });
  }
  selectDistinctOn(on, fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: void 0,
      dialect: this.getDialect(),
      distinct: { on }
    });
  }
  // Lazy load dialect to avoid circular dependency
  getDialect() {
    if (!this.dialect) {
      this.dialect = new PgDialect(this.dialectConfig);
    }
    return this.dialect;
  }
};

// node_modules/drizzle-orm/pg-core/query-builders/insert.js
var PgInsertBuilder = class {
  constructor(table, session, dialect, withList, overridingSystemValue_) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
    this.overridingSystemValue_ = overridingSystemValue_;
  }
  static [entityKind] = "PgInsertBuilder";
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  overridingSystemValue() {
    this.overridingSystemValue_ = true;
    return this;
  }
  values(values) {
    values = Array.isArray(values) ? values : [values];
    if (values.length === 0) {
      throw new Error("values() must be called with at least one value");
    }
    const mappedValues = values.map((entry) => {
      const result = {};
      const cols = this.table[Table.Symbol.Columns];
      for (const colKey of Object.keys(entry)) {
        const colValue = entry[colKey];
        result[colKey] = is(colValue, SQL) ? colValue : new Param(colValue, cols[colKey]);
      }
      return result;
    });
    return new PgInsertBase(
      this.table,
      mappedValues,
      this.session,
      this.dialect,
      this.withList,
      false,
      this.overridingSystemValue_
    ).setToken(this.authToken);
  }
  select(selectQuery) {
    const select = typeof selectQuery === "function" ? selectQuery(new QueryBuilder()) : selectQuery;
    if (!is(select, SQL) && !haveSameKeys(this.table[Columns], select._.selectedFields)) {
      throw new Error(
        "Insert select error: selected fields are not the same or are in a different order compared to the table definition"
      );
    }
    return new PgInsertBase(this.table, select, this.session, this.dialect, this.withList, true);
  }
};
var PgInsertBase = class extends QueryPromise {
  constructor(table, values, session, dialect, withList, select, overridingSystemValue_) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { table, values, withList, select, overridingSystemValue_ };
  }
  static [entityKind] = "PgInsert";
  config;
  returning(fields = this.config.table[Table.Symbol.Columns]) {
    this.config.returningFields = fields;
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /**
   * Adds an `on conflict do nothing` clause to the query.
   *
   * Calling this method simply avoids inserting a row as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#on-conflict-do-nothing}
   *
   * @param config The `target` and `where` clauses.
   *
   * @example
   * ```ts
   * // Insert one row and cancel the insert if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing();
   *
   * // Explicitly specify conflict target
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoNothing({ target: cars.id });
   * ```
   */
  onConflictDoNothing(config = {}) {
    if (config.target === void 0) {
      this.config.onConflict = sql`do nothing`;
    } else {
      let targetColumn = "";
      targetColumn = Array.isArray(config.target) ? config.target.map((it) => this.dialect.escapeName(this.dialect.casing.getColumnCasing(it))).join(",") : this.dialect.escapeName(this.dialect.casing.getColumnCasing(config.target));
      const whereSql = config.where ? sql` where ${config.where}` : void 0;
      this.config.onConflict = sql`(${sql.raw(targetColumn)})${whereSql} do nothing`;
    }
    return this;
  }
  /**
   * Adds an `on conflict do update` clause to the query.
   *
   * Calling this method will update the existing row that conflicts with the row proposed for insertion as its alternative action.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert#upserts-and-conflicts}
   *
   * @param config The `target`, `set` and `where` clauses.
   *
   * @example
   * ```ts
   * // Update the row if there's a conflict
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'Porsche' }
   *   });
   *
   * // Upsert with 'where' clause
   * await db.insert(cars)
   *   .values({ id: 1, brand: 'BMW' })
   *   .onConflictDoUpdate({
   *     target: cars.id,
   *     set: { brand: 'newBMW' },
   *     targetWhere: sql`${cars.createdAt} > '2023-01-01'::date`,
   *   });
   * ```
   */
  onConflictDoUpdate(config) {
    if (config.where && (config.targetWhere || config.setWhere)) {
      throw new Error(
        'You cannot use both "where" and "targetWhere"/"setWhere" at the same time - "where" is deprecated, use "targetWhere" or "setWhere" instead.'
      );
    }
    const whereSql = config.where ? sql` where ${config.where}` : void 0;
    const targetWhereSql = config.targetWhere ? sql` where ${config.targetWhere}` : void 0;
    const setWhereSql = config.setWhere ? sql` where ${config.setWhere}` : void 0;
    const setSql = this.dialect.buildUpdateSet(this.config.table, mapUpdateSet(this.config.table, config.set));
    let targetColumn = "";
    targetColumn = Array.isArray(config.target) ? config.target.map((it) => this.dialect.escapeName(this.dialect.casing.getColumnCasing(it))).join(",") : this.dialect.escapeName(this.dialect.casing.getColumnCasing(config.target));
    this.config.onConflict = sql`(${sql.raw(targetColumn)})${targetWhereSql} do update set ${setSql}${whereSql}${setWhereSql}`;
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildInsertQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name, true);
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
  /** @internal */
  getSelectedFields() {
    return this.config.returningFields ? new Proxy(
      this.config.returningFields,
      new SelectionProxyHandler({
        alias: getTableName(this.config.table),
        sqlAliasedBehavior: "alias",
        sqlBehavior: "error"
      })
    ) : void 0;
  }
  $dynamic() {
    return this;
  }
};

// node_modules/drizzle-orm/pg-core/query-builders/refresh-materialized-view.js
var PgRefreshMaterializedView = class extends QueryPromise {
  constructor(view, session, dialect) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { view };
  }
  static [entityKind] = "PgRefreshMaterializedView";
  config;
  concurrently() {
    if (this.config.withNoData !== void 0) {
      throw new Error("Cannot use concurrently and withNoData together");
    }
    this.config.concurrently = true;
    return this;
  }
  withNoData() {
    if (this.config.concurrently !== void 0) {
      throw new Error("Cannot use concurrently and withNoData together");
    }
    this.config.withNoData = true;
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildRefreshMaterializedViewQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), void 0, name, true);
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(placeholderValues, this.authToken);
    });
  };
};

// node_modules/drizzle-orm/pg-core/query-builders/update.js
var PgUpdateBuilder = class {
  constructor(table, session, dialect, withList) {
    this.table = table;
    this.session = session;
    this.dialect = dialect;
    this.withList = withList;
  }
  static [entityKind] = "PgUpdateBuilder";
  authToken;
  setToken(token) {
    this.authToken = token;
    return this;
  }
  set(values) {
    return new PgUpdateBase(
      this.table,
      mapUpdateSet(this.table, values),
      this.session,
      this.dialect,
      this.withList
    ).setToken(this.authToken);
  }
};
var PgUpdateBase = class extends QueryPromise {
  constructor(table, set, session, dialect, withList) {
    super();
    this.session = session;
    this.dialect = dialect;
    this.config = { set, table, withList, joins: [] };
    this.tableName = getTableLikeName(table);
    this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
  }
  static [entityKind] = "PgUpdate";
  config;
  tableName;
  joinsNotNullableMap;
  from(source) {
    const src = source;
    const tableName = getTableLikeName(src);
    if (typeof tableName === "string") {
      this.joinsNotNullableMap[tableName] = true;
    }
    this.config.from = src;
    return this;
  }
  getTableLikeFields(table) {
    if (is(table, PgTable)) {
      return table[Table.Symbol.Columns];
    } else if (is(table, Subquery)) {
      return table._.selectedFields;
    }
    return table[ViewBaseConfig].selectedFields;
  }
  createJoin(joinType) {
    return (table, on) => {
      const tableName = getTableLikeName(table);
      if (typeof tableName === "string" && this.config.joins.some((join) => join.alias === tableName)) {
        throw new Error(`Alias "${tableName}" is already used in this query`);
      }
      if (typeof on === "function") {
        const from = this.config.from && !is(this.config.from, SQL) ? this.getTableLikeFields(this.config.from) : void 0;
        on = on(
          new Proxy(
            this.config.table[Table.Symbol.Columns],
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          ),
          from && new Proxy(
            from,
            new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
          )
        );
      }
      this.config.joins.push({ on, table, joinType, alias: tableName });
      if (typeof tableName === "string") {
        switch (joinType) {
          case "left": {
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
          case "right": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "inner": {
            this.joinsNotNullableMap[tableName] = true;
            break;
          }
          case "full": {
            this.joinsNotNullableMap = Object.fromEntries(
              Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
            );
            this.joinsNotNullableMap[tableName] = false;
            break;
          }
        }
      }
      return this;
    };
  }
  leftJoin = this.createJoin("left");
  rightJoin = this.createJoin("right");
  innerJoin = this.createJoin("inner");
  fullJoin = this.createJoin("full");
  /**
   * Adds a 'where' clause to the query.
   *
   * Calling this method will update only those rows that fulfill a specified condition.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param where the 'where' clause.
   *
   * @example
   * You can use conditional operators and `sql function` to filter the rows to be updated.
   *
   * ```ts
   * // Update all cars with green color
   * await db.update(cars).set({ color: 'red' })
   *   .where(eq(cars.color, 'green'));
   * // or
   * await db.update(cars).set({ color: 'red' })
   *   .where(sql`${cars.color} = 'green'`)
   * ```
   *
   * You can logically combine conditional operators with `and()` and `or()` operators:
   *
   * ```ts
   * // Update all BMW cars with a green color
   * await db.update(cars).set({ color: 'red' })
   *   .where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
   *
   * // Update all cars with the green or blue color
   * await db.update(cars).set({ color: 'red' })
   *   .where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
   * ```
   */
  where(where) {
    this.config.where = where;
    return this;
  }
  returning(fields) {
    if (!fields) {
      fields = Object.assign({}, this.config.table[Table.Symbol.Columns]);
      if (this.config.from) {
        const tableName = getTableLikeName(this.config.from);
        if (typeof tableName === "string" && this.config.from && !is(this.config.from, SQL)) {
          const fromFields = this.getTableLikeFields(this.config.from);
          fields[tableName] = fromFields;
        }
        for (const join of this.config.joins) {
          const tableName2 = getTableLikeName(join.table);
          if (typeof tableName2 === "string" && !is(join.table, SQL)) {
            const fromFields = this.getTableLikeFields(join.table);
            fields[tableName2] = fromFields;
          }
        }
      }
    }
    this.config.returningFields = fields;
    this.config.returning = orderSelectedFields(fields);
    return this;
  }
  /** @internal */
  getSQL() {
    return this.dialect.buildUpdateQuery(this.config);
  }
  toSQL() {
    const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
    return rest;
  }
  /** @internal */
  _prepare(name) {
    const query = this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name, true);
    query.joinsNotNullableMap = this.joinsNotNullableMap;
    return query;
  }
  prepare(name) {
    return this._prepare(name);
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute = (placeholderValues) => {
    return this._prepare().execute(placeholderValues, this.authToken);
  };
  /** @internal */
  getSelectedFields() {
    return this.config.returningFields ? new Proxy(
      this.config.returningFields,
      new SelectionProxyHandler({
        alias: getTableName(this.config.table),
        sqlAliasedBehavior: "alias",
        sqlBehavior: "error"
      })
    ) : void 0;
  }
  $dynamic() {
    return this;
  }
};

// node_modules/drizzle-orm/pg-core/query-builders/count.js
var PgCountBuilder = class _PgCountBuilder extends SQL {
  constructor(params) {
    super(_PgCountBuilder.buildEmbeddedCount(params.source, params.filters).queryChunks);
    this.params = params;
    this.mapWith(Number);
    this.session = params.session;
    this.sql = _PgCountBuilder.buildCount(
      params.source,
      params.filters
    );
  }
  sql;
  token;
  static [entityKind] = "PgCountBuilder";
  [Symbol.toStringTag] = "PgCountBuilder";
  session;
  static buildEmbeddedCount(source, filters) {
    return sql`(select count(*) from ${source}${sql.raw(" where ").if(filters)}${filters})`;
  }
  static buildCount(source, filters) {
    return sql`select count(*) as count from ${source}${sql.raw(" where ").if(filters)}${filters};`;
  }
  /** @intrnal */
  setToken(token) {
    this.token = token;
    return this;
  }
  then(onfulfilled, onrejected) {
    return Promise.resolve(this.session.count(this.sql, this.token)).then(
      onfulfilled,
      onrejected
    );
  }
  catch(onRejected) {
    return this.then(void 0, onRejected);
  }
  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally?.();
        return value;
      },
      (reason) => {
        onFinally?.();
        throw reason;
      }
    );
  }
};

// node_modules/drizzle-orm/pg-core/query-builders/query.js
var RelationalQueryBuilder = class {
  constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session) {
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
  }
  static [entityKind] = "PgRelationalQueryBuilder";
  findMany(config) {
    return new PgRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? config : {},
      "many"
    );
  }
  findFirst(config) {
    return new PgRelationalQuery(
      this.fullSchema,
      this.schema,
      this.tableNamesMap,
      this.table,
      this.tableConfig,
      this.dialect,
      this.session,
      config ? { ...config, limit: 1 } : { limit: 1 },
      "first"
    );
  }
};
var PgRelationalQuery = class extends QueryPromise {
  constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session, config, mode) {
    super();
    this.fullSchema = fullSchema;
    this.schema = schema;
    this.tableNamesMap = tableNamesMap;
    this.table = table;
    this.tableConfig = tableConfig;
    this.dialect = dialect;
    this.session = session;
    this.config = config;
    this.mode = mode;
  }
  static [entityKind] = "PgRelationalQuery";
  /** @internal */
  _prepare(name) {
    return tracer.startActiveSpan("drizzle.prepareQuery", () => {
      const { query, builtQuery } = this._toSQL();
      return this.session.prepareQuery(
        builtQuery,
        void 0,
        name,
        true,
        (rawRows, mapColumnValue) => {
          const rows = rawRows.map(
            (row) => mapRelationalRow(this.schema, this.tableConfig, row, query.selection, mapColumnValue)
          );
          if (this.mode === "first") {
            return rows[0];
          }
          return rows;
        }
      );
    });
  }
  prepare(name) {
    return this._prepare(name);
  }
  _getQuery() {
    return this.dialect.buildRelationalQueryWithoutPK({
      fullSchema: this.fullSchema,
      schema: this.schema,
      tableNamesMap: this.tableNamesMap,
      table: this.table,
      tableConfig: this.tableConfig,
      queryConfig: this.config,
      tableAlias: this.tableConfig.tsName
    });
  }
  /** @internal */
  getSQL() {
    return this._getQuery().sql;
  }
  _toSQL() {
    const query = this._getQuery();
    const builtQuery = this.dialect.sqlToQuery(query.sql);
    return { query, builtQuery };
  }
  toSQL() {
    return this._toSQL().builtQuery;
  }
  authToken;
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  execute() {
    return tracer.startActiveSpan("drizzle.operation", () => {
      return this._prepare().execute(void 0, this.authToken);
    });
  }
};

// node_modules/drizzle-orm/pg-core/query-builders/raw.js
var PgRaw = class extends QueryPromise {
  constructor(execute, sql2, query, mapBatchResult) {
    super();
    this.execute = execute;
    this.sql = sql2;
    this.query = query;
    this.mapBatchResult = mapBatchResult;
  }
  static [entityKind] = "PgRaw";
  /** @internal */
  getSQL() {
    return this.sql;
  }
  getQuery() {
    return this.query;
  }
  mapResult(result, isFromBatch) {
    return isFromBatch ? this.mapBatchResult(result) : result;
  }
  _prepare() {
    return this;
  }
  /** @internal */
  isResponseInArrayMode() {
    return false;
  }
};

// node_modules/drizzle-orm/pg-core/db.js
var PgDatabase = class {
  constructor(dialect, session, schema) {
    this.dialect = dialect;
    this.session = session;
    this._ = schema ? {
      schema: schema.schema,
      fullSchema: schema.fullSchema,
      tableNamesMap: schema.tableNamesMap,
      session
    } : {
      schema: void 0,
      fullSchema: {},
      tableNamesMap: {},
      session
    };
    this.query = {};
    if (this._.schema) {
      for (const [tableName, columns] of Object.entries(this._.schema)) {
        this.query[tableName] = new RelationalQueryBuilder(
          schema.fullSchema,
          this._.schema,
          this._.tableNamesMap,
          schema.fullSchema[tableName],
          columns,
          dialect,
          session
        );
      }
    }
  }
  static [entityKind] = "PgDatabase";
  query;
  /**
   * Creates a subquery that defines a temporary named result set as a CTE.
   *
   * It is useful for breaking down complex queries into simpler parts and for reusing the result set in subsequent parts of the query.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param alias The alias for the subquery.
   *
   * Failure to provide an alias will result in a DrizzleTypeError, preventing the subquery from being referenced in other queries.
   *
   * @example
   *
   * ```ts
   * // Create a subquery with alias 'sq' and use it in the select query
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * const result = await db.with(sq).select().from(sq);
   * ```
   *
   * To select arbitrary SQL values as fields in a CTE and reference them in other CTEs or in the main query, you need to add aliases to them:
   *
   * ```ts
   * // Select an arbitrary SQL value as a field in a CTE and reference it in the main query
   * const sq = db.$with('sq').as(db.select({
   *   name: sql<string>`upper(${users.name})`.as('name'),
   * })
   * .from(users));
   *
   * const result = await db.with(sq).select({ name: sq.name }).from(sq);
   * ```
   */
  $with = (alias, selection) => {
    const self = this;
    const as = (qb) => {
      if (typeof qb === "function") {
        qb = qb(new QueryBuilder(self.dialect));
      }
      return new Proxy(
        new WithSubquery(
          qb.getSQL(),
          selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
          alias,
          true
        ),
        new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
      );
    };
    return { as };
  };
  $count(source, filters) {
    return new PgCountBuilder({ source, filters, session: this.session });
  }
  /**
   * Incorporates a previously defined CTE (using `$with`) into the main query.
   *
   * This method allows the main query to reference a temporary named result set.
   *
   * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
   *
   * @param queries The CTEs to incorporate into the main query.
   *
   * @example
   *
   * ```ts
   * // Define a subquery 'sq' as a CTE using $with
   * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
   *
   * // Incorporate the CTE 'sq' into the main query and select from it
   * const result = await db.with(sq).select().from(sq);
   * ```
   */
  with(...queries) {
    const self = this;
    function select(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries
      });
    }
    function selectDistinct(fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries,
        distinct: true
      });
    }
    function selectDistinctOn(on, fields) {
      return new PgSelectBuilder({
        fields: fields ?? void 0,
        session: self.session,
        dialect: self.dialect,
        withList: queries,
        distinct: { on }
      });
    }
    function update(table) {
      return new PgUpdateBuilder(table, self.session, self.dialect, queries);
    }
    function insert(table) {
      return new PgInsertBuilder(table, self.session, self.dialect, queries);
    }
    function delete_(table) {
      return new PgDeleteBase(table, self.session, self.dialect, queries);
    }
    return { select, selectDistinct, selectDistinctOn, update, insert, delete: delete_ };
  }
  select(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect
    });
  }
  selectDistinct(fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: true
    });
  }
  selectDistinctOn(on, fields) {
    return new PgSelectBuilder({
      fields: fields ?? void 0,
      session: this.session,
      dialect: this.dialect,
      distinct: { on }
    });
  }
  /**
   * Creates an update query.
   *
   * Calling this method without `.where()` clause will update all rows in a table. The `.where()` clause specifies which rows should be updated.
   *
   * Use `.set()` method to specify which values to update.
   *
   * See docs: {@link https://orm.drizzle.team/docs/update}
   *
   * @param table The table to update.
   *
   * @example
   *
   * ```ts
   * // Update all rows in the 'cars' table
   * await db.update(cars).set({ color: 'red' });
   *
   * // Update rows with filters and conditions
   * await db.update(cars).set({ color: 'red' }).where(eq(cars.brand, 'BMW'));
   *
   * // Update with returning clause
   * const updatedCar: Car[] = await db.update(cars)
   *   .set({ color: 'red' })
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  update(table) {
    return new PgUpdateBuilder(table, this.session, this.dialect);
  }
  /**
   * Creates an insert query.
   *
   * Calling this method will create new rows in a table. Use `.values()` method to specify which values to insert.
   *
   * See docs: {@link https://orm.drizzle.team/docs/insert}
   *
   * @param table The table to insert into.
   *
   * @example
   *
   * ```ts
   * // Insert one row
   * await db.insert(cars).values({ brand: 'BMW' });
   *
   * // Insert multiple rows
   * await db.insert(cars).values([{ brand: 'BMW' }, { brand: 'Porsche' }]);
   *
   * // Insert with returning clause
   * const insertedCar: Car[] = await db.insert(cars)
   *   .values({ brand: 'BMW' })
   *   .returning();
   * ```
   */
  insert(table) {
    return new PgInsertBuilder(table, this.session, this.dialect);
  }
  /**
   * Creates a delete query.
   *
   * Calling this method without `.where()` clause will delete all rows in a table. The `.where()` clause specifies which rows should be deleted.
   *
   * See docs: {@link https://orm.drizzle.team/docs/delete}
   *
   * @param table The table to delete from.
   *
   * @example
   *
   * ```ts
   * // Delete all rows in the 'cars' table
   * await db.delete(cars);
   *
   * // Delete rows with filters and conditions
   * await db.delete(cars).where(eq(cars.color, 'green'));
   *
   * // Delete with returning clause
   * const deletedCar: Car[] = await db.delete(cars)
   *   .where(eq(cars.id, 1))
   *   .returning();
   * ```
   */
  delete(table) {
    return new PgDeleteBase(table, this.session, this.dialect);
  }
  refreshMaterializedView(view) {
    return new PgRefreshMaterializedView(view, this.session, this.dialect);
  }
  authToken;
  execute(query) {
    const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
    const builtQuery = this.dialect.sqlToQuery(sequel);
    const prepared = this.session.prepareQuery(
      builtQuery,
      void 0,
      void 0,
      false
    );
    return new PgRaw(
      () => prepared.execute(void 0, this.authToken),
      sequel,
      builtQuery,
      (result) => prepared.mapResult(result, true)
    );
  }
  transaction(transaction, config) {
    return this.session.transaction(transaction, config);
  }
};

// node_modules/drizzle-orm/pg-core/session.js
var PgPreparedQuery = class {
  constructor(query) {
    this.query = query;
  }
  authToken;
  getQuery() {
    return this.query;
  }
  mapResult(response, _isFromBatch) {
    return response;
  }
  /** @internal */
  setToken(token) {
    this.authToken = token;
    return this;
  }
  static [entityKind] = "PgPreparedQuery";
  /** @internal */
  joinsNotNullableMap;
};
var PgSession = class {
  constructor(dialect) {
    this.dialect = dialect;
  }
  static [entityKind] = "PgSession";
  /** @internal */
  execute(query, token) {
    return tracer.startActiveSpan("drizzle.operation", () => {
      const prepared = tracer.startActiveSpan("drizzle.prepareQuery", () => {
        return this.prepareQuery(
          this.dialect.sqlToQuery(query),
          void 0,
          void 0,
          false
        );
      });
      return prepared.setToken(token).execute(void 0, token);
    });
  }
  all(query) {
    return this.prepareQuery(
      this.dialect.sqlToQuery(query),
      void 0,
      void 0,
      false
    ).all();
  }
  /** @internal */
  async count(sql2, token) {
    const res = await this.execute(sql2, token);
    return Number(
      res[0]["count"]
    );
  }
};
var PgTransaction = class extends PgDatabase {
  constructor(dialect, session, schema, nestedIndex = 0) {
    super(dialect, session, schema);
    this.schema = schema;
    this.nestedIndex = nestedIndex;
  }
  static [entityKind] = "PgTransaction";
  rollback() {
    throw new TransactionRollbackError();
  }
  /** @internal */
  getTransactionConfigSQL(config) {
    const chunks = [];
    if (config.isolationLevel) {
      chunks.push(`isolation level ${config.isolationLevel}`);
    }
    if (config.accessMode) {
      chunks.push(config.accessMode);
    }
    if (typeof config.deferrable === "boolean") {
      chunks.push(config.deferrable ? "deferrable" : "not deferrable");
    }
    return sql.raw(chunks.join(" "));
  }
  setTransaction(config) {
    return this.session.execute(sql`set transaction ${this.getTransactionConfigSQL(config)}`);
  }
};

// node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever3(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever3;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json2 = JSON.stringify(obj, null, 2);
  return json2.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path: path2, errorMaps, issueData } = params;
  const fullPath = [...path2, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path2, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path2;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version2) {
  if ((version2 === "v4" || !version2) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version2 === "v6" || !version2) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version2) {
  if ((version2 === "v4" || !version2) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version2 === "v6" || !version2) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types3, params) => {
  return new ZodUnion({
    options: types3,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: ((arg) => ZodString.create({ ...arg, coerce: true })),
  number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
  boolean: ((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  })),
  bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
  date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
};
var NEVER = INVALID;

// node_modules/drizzle-zod/index.mjs
var CONSTANTS = {
  INT8_MIN: -128,
  INT8_MAX: 127,
  INT8_UNSIGNED_MAX: 255,
  INT16_MIN: -32768,
  INT16_MAX: 32767,
  INT16_UNSIGNED_MAX: 65535,
  INT24_MIN: -8388608,
  INT24_MAX: 8388607,
  INT24_UNSIGNED_MAX: 16777215,
  INT32_MIN: -2147483648,
  INT32_MAX: 2147483647,
  INT32_UNSIGNED_MAX: 4294967295,
  INT48_MIN: -140737488355328,
  INT48_MAX: 140737488355327,
  INT48_UNSIGNED_MAX: 281474976710655,
  INT64_MIN: -9223372036854775808n,
  INT64_MAX: 9223372036854775807n,
  INT64_UNSIGNED_MAX: 18446744073709551615n
};
function isColumnType(column, columnTypes) {
  return columnTypes.includes(column.columnType);
}
function isWithEnum(column) {
  return "enumValues" in column && Array.isArray(column.enumValues) && column.enumValues.length > 0;
}
var literalSchema = external_exports.union([external_exports.string(), external_exports.number(), external_exports.boolean(), external_exports.null()]);
var jsonSchema = external_exports.union([literalSchema, external_exports.record(external_exports.any()), external_exports.array(external_exports.any())]);
var bufferSchema = external_exports.custom((v) => v instanceof Buffer);
function columnToSchema(column, factory) {
  const z$1 = factory?.zodInstance ?? external_exports;
  const coerce2 = factory?.coerce ?? {};
  let schema;
  if (isWithEnum(column)) {
    schema = column.enumValues.length ? z$1.enum(column.enumValues) : z$1.string();
  }
  if (!schema) {
    if (isColumnType(column, ["PgGeometry", "PgPointTuple"])) {
      schema = z$1.tuple([z$1.number(), z$1.number()]);
    } else if (isColumnType(column, ["PgGeometryObject", "PgPointObject"])) {
      schema = z$1.object({ x: z$1.number(), y: z$1.number() });
    } else if (isColumnType(column, ["PgHalfVector", "PgVector"])) {
      schema = z$1.array(z$1.number());
      schema = column.dimensions ? schema.length(column.dimensions) : schema;
    } else if (isColumnType(column, ["PgLine"])) {
      schema = z$1.tuple([z$1.number(), z$1.number(), z$1.number()]);
    } else if (isColumnType(column, ["PgLineABC"])) {
      schema = z$1.object({
        a: z$1.number(),
        b: z$1.number(),
        c: z$1.number()
      });
    } else if (isColumnType(column, ["PgArray"])) {
      schema = z$1.array(columnToSchema(column.baseColumn, z$1));
      schema = column.size ? schema.length(column.size) : schema;
    } else if (column.dataType === "array") {
      schema = z$1.array(z$1.any());
    } else if (column.dataType === "number") {
      schema = numberColumnToSchema(column, z$1, coerce2);
    } else if (column.dataType === "bigint") {
      schema = bigintColumnToSchema(column, z$1, coerce2);
    } else if (column.dataType === "boolean") {
      schema = coerce2 === true || coerce2.boolean ? z$1.coerce.boolean() : z$1.boolean();
    } else if (column.dataType === "date") {
      schema = coerce2 === true || coerce2.date ? z$1.coerce.date() : z$1.date();
    } else if (column.dataType === "string") {
      schema = stringColumnToSchema(column, z$1, coerce2);
    } else if (column.dataType === "json") {
      schema = jsonSchema;
    } else if (column.dataType === "custom") {
      schema = z$1.any();
    } else if (column.dataType === "buffer") {
      schema = bufferSchema;
    }
  }
  if (!schema) {
    schema = z$1.any();
  }
  return schema;
}
function numberColumnToSchema(column, z, coerce2) {
  let unsigned = column.getSQLType().includes("unsigned");
  let min;
  let max;
  let integer2 = false;
  if (isColumnType(column, ["MySqlTinyInt", "SingleStoreTinyInt"])) {
    min = unsigned ? 0 : CONSTANTS.INT8_MIN;
    max = unsigned ? CONSTANTS.INT8_UNSIGNED_MAX : CONSTANTS.INT8_MAX;
    integer2 = true;
  } else if (isColumnType(column, [
    "PgSmallInt",
    "PgSmallSerial",
    "MySqlSmallInt",
    "SingleStoreSmallInt"
  ])) {
    min = unsigned ? 0 : CONSTANTS.INT16_MIN;
    max = unsigned ? CONSTANTS.INT16_UNSIGNED_MAX : CONSTANTS.INT16_MAX;
    integer2 = true;
  } else if (isColumnType(column, [
    "PgReal",
    "MySqlFloat",
    "MySqlMediumInt",
    "SingleStoreMediumInt",
    "SingleStoreFloat"
  ])) {
    min = unsigned ? 0 : CONSTANTS.INT24_MIN;
    max = unsigned ? CONSTANTS.INT24_UNSIGNED_MAX : CONSTANTS.INT24_MAX;
    integer2 = isColumnType(column, ["MySqlMediumInt", "SingleStoreMediumInt"]);
  } else if (isColumnType(column, [
    "PgInteger",
    "PgSerial",
    "MySqlInt",
    "SingleStoreInt"
  ])) {
    min = unsigned ? 0 : CONSTANTS.INT32_MIN;
    max = unsigned ? CONSTANTS.INT32_UNSIGNED_MAX : CONSTANTS.INT32_MAX;
    integer2 = true;
  } else if (isColumnType(column, [
    "PgDoublePrecision",
    "MySqlReal",
    "MySqlDouble",
    "SingleStoreReal",
    "SingleStoreDouble",
    "SQLiteReal"
  ])) {
    min = unsigned ? 0 : CONSTANTS.INT48_MIN;
    max = unsigned ? CONSTANTS.INT48_UNSIGNED_MAX : CONSTANTS.INT48_MAX;
  } else if (isColumnType(column, [
    "PgBigInt53",
    "PgBigSerial53",
    "MySqlBigInt53",
    "MySqlSerial",
    "SingleStoreBigInt53",
    "SingleStoreSerial",
    "SQLiteInteger"
  ])) {
    unsigned = unsigned || isColumnType(column, ["MySqlSerial", "SingleStoreSerial"]);
    min = unsigned ? 0 : Number.MIN_SAFE_INTEGER;
    max = Number.MAX_SAFE_INTEGER;
    integer2 = true;
  } else if (isColumnType(column, ["MySqlYear", "SingleStoreYear"])) {
    min = 1901;
    max = 2155;
    integer2 = true;
  } else {
    min = Number.MIN_SAFE_INTEGER;
    max = Number.MAX_SAFE_INTEGER;
  }
  let schema = coerce2 === true || coerce2?.number ? z.coerce.number() : z.number();
  schema = schema.min(min).max(max);
  return integer2 ? schema.int() : schema;
}
function bigintColumnToSchema(column, z, coerce2) {
  const unsigned = column.getSQLType().includes("unsigned");
  const min = unsigned ? 0n : CONSTANTS.INT64_MIN;
  const max = unsigned ? CONSTANTS.INT64_UNSIGNED_MAX : CONSTANTS.INT64_MAX;
  const schema = coerce2 === true || coerce2?.bigint ? z.coerce.bigint() : z.bigint();
  return schema.min(min).max(max);
}
function stringColumnToSchema(column, z, coerce2) {
  if (isColumnType(column, ["PgUUID"])) {
    return z.string().uuid();
  }
  let max;
  let regex;
  let fixed = false;
  if (isColumnType(column, ["PgVarchar", "SQLiteText"])) {
    max = column.length;
  } else if (isColumnType(column, ["MySqlVarChar", "SingleStoreVarChar"])) {
    max = column.length ?? CONSTANTS.INT16_UNSIGNED_MAX;
  } else if (isColumnType(column, ["MySqlText", "SingleStoreText"])) {
    if (column.textType === "longtext") {
      max = CONSTANTS.INT32_UNSIGNED_MAX;
    } else if (column.textType === "mediumtext") {
      max = CONSTANTS.INT24_UNSIGNED_MAX;
    } else if (column.textType === "text") {
      max = CONSTANTS.INT16_UNSIGNED_MAX;
    } else {
      max = CONSTANTS.INT8_UNSIGNED_MAX;
    }
  }
  if (isColumnType(column, [
    "PgChar",
    "MySqlChar",
    "SingleStoreChar"
  ])) {
    max = column.length;
    fixed = true;
  }
  if (isColumnType(column, ["PgBinaryVector"])) {
    regex = /^[01]+$/;
    max = column.dimensions;
  }
  let schema = coerce2 === true || coerce2?.string ? z.coerce.string() : z.string();
  schema = regex ? schema.regex(regex) : schema;
  return max && fixed ? schema.length(max) : max ? schema.max(max) : schema;
}
function getColumns(tableLike) {
  return isTable(tableLike) ? getTableColumns(tableLike) : getViewSelectedFields(tableLike);
}
function handleColumns(columns, refinements, conditions, factory) {
  const columnSchemas = {};
  for (const [key, selected] of Object.entries(columns)) {
    if (!is(selected, Column) && !is(selected, SQL) && !is(selected, SQL.Aliased) && typeof selected === "object") {
      const columns2 = isTable(selected) || isView(selected) ? getColumns(selected) : selected;
      columnSchemas[key] = handleColumns(columns2, refinements[key] ?? {}, conditions, factory);
      continue;
    }
    const refinement = refinements[key];
    if (refinement !== void 0 && typeof refinement !== "function") {
      columnSchemas[key] = refinement;
      continue;
    }
    const column = is(selected, Column) ? selected : void 0;
    const schema = column ? columnToSchema(column, factory) : external_exports.any();
    const refined = typeof refinement === "function" ? refinement(schema) : schema;
    if (conditions.never(column)) {
      continue;
    } else {
      columnSchemas[key] = refined;
    }
    if (column) {
      if (conditions.nullable(column)) {
        columnSchemas[key] = columnSchemas[key].nullable();
      }
      if (conditions.optional(column)) {
        columnSchemas[key] = columnSchemas[key].optional();
      }
    }
  }
  return external_exports.object(columnSchemas);
}
var insertConditions = {
  never: (column) => column?.generated?.type === "always" || column?.generatedIdentity?.type === "always",
  optional: (column) => !column.notNull || column.notNull && column.hasDefault,
  nullable: (column) => !column.notNull
};
var createInsertSchema = (entity, refine) => {
  const columns = getColumns(entity);
  return handleColumns(columns, refine ?? {}, insertConditions);
};

// shared/models/chat.ts
var conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull()
});
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull()
});
var insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true
});
var insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true
});

// shared/schema.ts
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var articles = pgTable("articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull().default(""),
  excerpt: text("excerpt"),
  status: text("status").notNull().default("draft"),
  // draft, published, archived
  author: text("author"),
  category: text("category"),
  tags: text("tags").array(),
  targetKeyword: text("target_keyword"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  wordCount: integer("word_count").default(0),
  readabilityScore: integer("readability_score"),
  seoScore: integer("seo_score"),
  recommendedKeywords: text("recommended_keywords").array(),
  writingStyleId: text("writing_style_id"),
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").notNull().default(sql`now()`)
});
var insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var keywords = pgTable("keywords", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  keyword: text("keyword").notNull(),
  volume: integer("volume"),
  difficulty: integer("difficulty"),
  currentPosition: integer("current_position"),
  previousPosition: integer("previous_position"),
  url: text("url"),
  clicks: integer("clicks").default(0),
  impressions: integer("impressions").default(0),
  ctr: text("ctr"),
  lastUpdated: text("last_updated").notNull().default(sql`now()`)
});
var insertKeywordSchema = createInsertSchema(keywords).omit({
  id: true,
  lastUpdated: true
});
var integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  // ahrefs, gsc, ga
  status: text("status").notNull().default("disconnected"),
  // connected, disconnected, error
  lastSync: text("last_sync"),
  config: jsonb("config")
});
var insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true
});
var contentSuggestions = pgTable("content_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").references(() => articles.id),
  type: text("type").notNull(),
  // keyword, structure, readability, competitor
  suggestion: text("suggestion").notNull(),
  priority: text("priority").default("medium"),
  // low, medium, high
  applied: boolean("applied").default(false),
  createdAt: text("created_at").notNull().default(sql`now()`)
});
var insertContentSuggestionSchema = createInsertSchema(contentSuggestions).omit({
  id: true,
  createdAt: true
});
var analyticsSnapshots = pgTable("analytics_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(),
  pageViews: integer("page_views").default(0),
  uniqueVisitors: integer("unique_visitors").default(0),
  bounceRate: text("bounce_rate"),
  avgSessionDuration: text("avg_session_duration"),
  topPages: jsonb("top_pages"),
  trafficSources: jsonb("traffic_sources")
});
var insertAnalyticsSnapshotSchema = createInsertSchema(analyticsSnapshots).omit({
  id: true
});
var writingStyles = pgTable("writing_styles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  tone: text("tone"),
  // professional, casual, friendly, authoritative
  guidelines: text("guidelines"),
  exampleText: text("example_text"),
  isDefault: boolean("is_default").default(false),
  createdAt: text("created_at").notNull().default(sql`now()`)
});
var insertWritingStyleSchema = createInsertSchema(writingStyles).omit({
  id: true,
  createdAt: true
});
var optimizationPrompts = pgTable("optimization_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  prompt: text("prompt").notNull(),
  promptType: text("prompt_type").notNull().default("analysis"),
  isDefault: boolean("is_default").default(false),
  createdAt: text("created_at").notNull().default(sql`now()`)
});
var insertOptimizationPromptSchema = createInsertSchema(optimizationPrompts).omit({
  id: true,
  createdAt: true
});
var seoSettings = pgTable("seo_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metaTitleGuidelines: text("meta_title_guidelines"),
  metaTitleMaxLength: integer("meta_title_max_length").default(60),
  metaDescriptionGuidelines: text("meta_description_guidelines"),
  metaDescriptionMaxLength: integer("meta_description_max_length").default(160),
  optimizationPrompt: text("optimization_prompt"),
  updatedAt: text("updated_at").notNull().default(sql`now()`)
});
var insertSeoSettingsSchema = createInsertSchema(seoSettings).omit({
  id: true,
  updatedAt: true
});
var imageStyles = pgTable("image_styles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  stylePrompt: text("style_prompt"),
  // e.g., "photorealistic", "digital art", "watercolor"
  aspectRatio: text("aspect_ratio").default("16:9"),
  // 1:1, 16:9, 4:3, 9:16
  additionalInstructions: text("additional_instructions"),
  isDefault: boolean("is_default").default(false),
  createdAt: text("created_at").notNull().default(sql`now()`)
});
var insertImageStyleSchema = createInsertSchema(imageStyles).omit({
  id: true,
  createdAt: true
});
var targetAudiences = pgTable("target_audiences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  demographics: text("demographics"),
  // e.g., "women 35-55, interested in spirituality"
  painPoints: text("pain_points"),
  // What problems do they have?
  goals: text("goals"),
  // What are they trying to achieve?
  tone: text("tone"),
  // How should we speak to them?
  isDefault: boolean("is_default").default(false),
  createdAt: text("created_at").notNull().default(sql`now()`)
});
var insertTargetAudienceSchema = createInsertSchema(targetAudiences).omit({
  id: true,
  createdAt: true
});
var linkTableColumns = pgTable("link_table_columns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`now()`)
});
var insertLinkTableColumnSchema = createInsertSchema(linkTableColumns).omit({
  id: true,
  createdAt: true
});
var siteUrls = pgTable("site_urls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().default(""),
  // Row identifier/name
  data: json("data").$type().default({}),
  // Dynamic column values
  createdAt: text("created_at").notNull().default(sql`now()`)
});
var insertSiteUrlSchema = createInsertSchema(siteUrls).omit({
  id: true,
  createdAt: true
});
var optimizationAnalyses = pgTable("optimization_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  targetKeyword: text("target_keyword").notNull(),
  dateRange: text("date_range").default("28"),
  pageTitle: text("page_title"),
  pageMetaDescription: text("page_meta_description"),
  pageWordCount: integer("page_word_count"),
  keywords: jsonb("keywords"),
  // Array of keyword data from GSC
  competitors: jsonb("competitors"),
  // Array of competitor analysis
  recommendations: jsonb("recommendations"),
  // Array of AI recommendations
  pageContent: jsonb("page_content"),
  // Full page content data including headings
  createdAt: text("created_at").notNull().default(sql`now()`)
});
var insertOptimizationAnalysisSchema = createInsertSchema(optimizationAnalyses).omit({
  id: true,
  createdAt: true
});
var horoscopePrompts = pgTable("horoscope_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  site: text("site").notNull().default("psychicsource"),
  // psychicsource, pathforward
  type: text("type").notNull(),
  // daily, weekly, monthly
  language: text("language").notNull().default("en"),
  // en, es
  prompt: text("prompt").notNull(),
  aiModel: text("ai_model").default("claude"),
  // claude, gpt
  isActive: boolean("is_active").default(true),
  updatedAt: text("updated_at").notNull().default(sql`now()`)
});
var insertHoroscopePromptSchema = createInsertSchema(horoscopePrompts).omit({
  id: true,
  updatedAt: true
});
var horoscopeEntries = pgTable("horoscope_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  site: text("site").notNull().default("psychicsource"),
  // psychicsource, pathforward
  type: text("type").notNull(),
  // daily, weekly, monthly
  language: text("language").notNull().default("en"),
  sign: text("sign").notNull(),
  // aries, taurus, etc.
  content: text("content").notNull(),
  periodStart: text("period_start").notNull(),
  // date string YYYY-MM-DD
  periodEnd: text("period_end").notNull(),
  status: text("status").notNull().default("published"),
  // draft, published
  createdAt: text("created_at").notNull().default(sql`now()`)
});
var insertHoroscopeEntrySchema = createInsertSchema(horoscopeEntries).omit({
  id: true,
  createdAt: true
});
var psychics = pgTable("psychics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  firebaseUid: text("firebase_uid"),
  status: text("status").notNull().default("active"),
  // active, inactive
  createdAt: text("created_at").notNull().default(sql`now()`)
});
var insertPsychicSchema = createInsertSchema(psychics).omit({
  id: true,
  createdAt: true
});
var videoRequests = pgTable("video_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  hook: text("hook"),
  videoDuration: text("video_duration"),
  // e.g. "30s", "60s", "90s"
  requiredDate: text("required_date"),
  payAmount: text("pay_amount"),
  description: text("description"),
  status: text("status").notNull().default("available"),
  // available, claimed, submitted, revision_requested, approved, paid
  claimedBy: text("claimed_by"),
  // psychic id
  claimedAt: text("claimed_at"),
  submittedAt: text("submitted_at"),
  approvedAt: text("approved_at"),
  videoUrl: text("video_url"),
  // S3 URL
  watermarkedVideoUrl: text("watermarked_video_url"),
  // S3 key for watermarked version
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").notNull().default(sql`now()`)
});
var insertVideoRequestSchema = createInsertSchema(videoRequests).omit({
  id: true,
  claimedBy: true,
  claimedAt: true,
  submittedAt: true,
  approvedAt: true,
  videoUrl: true,
  createdAt: true,
  updatedAt: true
});
var videoMessages = pgTable("video_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoRequestId: text("video_request_id").notNull(),
  senderType: text("sender_type").notNull(),
  // admin, psychic
  senderName: text("sender_name").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull().default(sql`now()`)
});
var insertVideoMessageSchema = createInsertSchema(videoMessages).omit({
  id: true,
  createdAt: true
});
var videoCaptions = pgTable("video_captions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoRequestId: text("video_request_id").notNull(),
  caption: text("caption").notNull(),
  hashtags: text("hashtags").notNull(),
  platform: text("platform").notNull(),
  // tiktok, instagram, youtube, facebook
  createdAt: text("created_at").notNull().default(sql`now()`)
});
var insertVideoCaptionSchema = createInsertSchema(videoCaptions).omit({
  id: true,
  createdAt: true
});
var videoCaptionPrompts = pgTable("video_caption_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform").notNull(),
  // tiktok, instagram, youtube, facebook
  captionPrompt: text("caption_prompt").notNull(),
  hashtagPrompt: text("hashtag_prompt").notNull(),
  isActive: boolean("is_active").default(true),
  updatedAt: text("updated_at").notNull().default(sql`now()`)
});
var insertVideoCaptionPromptSchema = createInsertSchema(videoCaptionPrompts).omit({
  id: true,
  updatedAt: true
});
var vspContentProjects = pgTable("vsp_content_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(),
  subtopic: text("subtopic").notNull(),
  campaignId: varchar("campaign_id"),
  scheduledDate: date("scheduled_date"),
  publishedDate: timestamp("published_date"),
  priority: text("priority").default("medium"),
  isTemplate: boolean("is_template").default(false),
  script: json("script").$type(),
  caption: json("caption").$type(),
  videoSettings: json("video_settings"),
  videoUrl: text("video_url"),
  revidProjectId: text("revid_project_id"),
  veoOperationName: text("veo_operation_name"),
  falRequestId: text("fal_request_id"),
  status: text("status").notNull().default("draft"),
  analytics: json("analytics"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertVspContentProjectSchema = createInsertSchema(vspContentProjects).pick({
  category: true,
  subtopic: true,
  script: true,
  caption: true,
  videoSettings: true,
  videoUrl: true,
  status: true
});
var vspCampaigns = pgTable("vsp_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status").notNull().default("planning"),
  goals: json("goals"),
  color: text("color").default("#3b82f6"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertVspCampaignSchema = createInsertSchema(vspCampaigns).pick({
  name: true,
  description: true,
  startDate: true,
  endDate: true,
  status: true,
  goals: true,
  color: true
});
var vspContentCalendar = pgTable("vsp_content_calendar", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  scheduledDate: date("scheduled_date").notNull(),
  category: text("category").notNull(),
  subtopic: text("subtopic").notNull(),
  campaignId: varchar("campaign_id"),
  projectId: varchar("project_id"),
  status: text("status").notNull().default("planned"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertVspContentCalendarSchema = createInsertSchema(vspContentCalendar).pick({
  title: true,
  description: true,
  scheduledDate: true,
  category: true,
  subtopic: true,
  campaignId: true,
  status: true,
  notes: true
});
var vspContentTemplates = pgTable("vsp_content_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  subtopic: text("subtopic").notNull(),
  scriptTemplate: text("script_template").notNull(),
  captionTemplate: text("caption_template"),
  tags: json("tags").$type().default([]),
  isPublic: boolean("is_public").default(false),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertVspContentTemplateSchema = createInsertSchema(vspContentTemplates).pick({
  name: true,
  category: true,
  subtopic: true,
  scriptTemplate: true,
  captionTemplate: true,
  tags: true,
  isPublic: true
});
var vspCampaignTemplates = pgTable("vsp_campaign_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  duration: integer("duration_days").notNull(),
  contentFrequency: integer("content_frequency").notNull(),
  contentMix: json("content_mix").default({ mainTheme: 70, related: 20, engagement: 10 }),
  contentTypes: json("content_types").$type().default(["script", "caption"]),
  schedulingPattern: json("scheduling_pattern"),
  subtopics: json("subtopics").$type().notNull(),
  goals: json("goals"),
  isPublic: boolean("is_public").default(false),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertVspCampaignTemplateSchema = createInsertSchema(vspCampaignTemplates).omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true
});
var vspBulkGenerationJobs = pgTable("vsp_bulk_generation_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull(),
  templateId: varchar("template_id"),
  status: text("status").notNull().default("pending"),
  totalItems: integer("total_items").notNull(),
  completedItems: integer("completed_items").default(0),
  failedItems: integer("failed_items").default(0),
  generationType: text("generation_type").notNull(),
  scheduledDates: json("scheduled_dates").$type(),
  progress: json("progress"),
  errors: json("errors"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertVspBulkGenerationJobSchema = createInsertSchema(vspBulkGenerationJobs).omit({
  id: true,
  completedItems: true,
  failedItems: true,
  progress: true,
  errors: true,
  createdAt: true,
  updatedAt: true
});
var vspContentCategories = pgTable("vsp_content_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertVspContentCategorySchema = createInsertSchema(vspContentCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var vspContentSubtopics = pgTable("vsp_content_subtopics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => vspContentCategories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertVspContentSubtopicSchema = createInsertSchema(vspContentSubtopics).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var vspScriptStyles = pgTable("vsp_script_styles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  description: text("description"),
  promptTemplate: text("prompt_template").notNull(),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertVspScriptStyleSchema = createInsertSchema(vspScriptStyles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var vspCaptionStyles = pgTable("vsp_caption_styles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  description: text("description"),
  promptTemplate: text("prompt_template").notNull(),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertVspCaptionStyleSchema = createInsertSchema(vspCaptionStyles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var vspScriptGenerationSchema = external_exports.object({
  category: external_exports.string(),
  subtopic: external_exports.string(),
  style: external_exports.string(),
  length: external_exports.enum(["15s", "30s", "60s"])
});
var vspCaptionGenerationSchema = external_exports.object({
  projectId: external_exports.string(),
  tone: external_exports.string(),
  hashtagCount: external_exports.number().min(5).max(20)
});
var vspVideoGenerationSchema = external_exports.object({
  projectId: external_exports.string(),
  videoEngine: external_exports.enum(["revid", "veo", "kling", "omnihuman"]).default("revid"),
  style: external_exports.string().optional(),
  voice: external_exports.string().optional(),
  generationPreset: external_exports.string().optional(),
  qualityTier: external_exports.string().optional(),
  captionStyle: external_exports.string().optional(),
  audio: external_exports.string().optional(),
  resolution: external_exports.enum(["720p", "1080p"]).optional(),
  compression: external_exports.number().optional(),
  frameRate: external_exports.number().optional(),
  hasToGenerateCover: external_exports.boolean().optional(),
  ratio: external_exports.enum(["9 / 16", "16 / 9", "1 / 1"]).optional(),
  disableCaptions: external_exports.boolean().optional(),
  captionPositionName: external_exports.enum(["bottom", "middle", "top"]).optional(),
  hasToGenerateVoice: external_exports.boolean().optional(),
  hasToGenerateMusic: external_exports.boolean().optional(),
  generationMusicPrompt: external_exports.string().optional(),
  veoAspectRatio: external_exports.enum(["9:16", "16:9"]).optional(),
  veoResolution: external_exports.enum(["720p", "1080p", "4k"]).optional(),
  veoDuration: external_exports.enum(["auto", "4", "6", "8"]).optional(),
  veoFirstFrameImage: external_exports.string().optional(),
  // base64 image to use as first frame
  veoLastFrameImage: external_exports.string().optional(),
  // base64 image for interpolation (used with first frame)
  veoPersonGeneration: external_exports.enum(["dont_allow", "allow_adult", "allow_all"]).optional(),
  veoNumberOfVideos: external_exports.number().min(1).max(4).optional(),
  veoCustomInstructions: external_exports.string().optional(),
  veoReferenceImages: external_exports.array(external_exports.string()).max(3).optional(),
  characterProfile: external_exports.object({
    description: external_exports.string(),
    wardrobe: external_exports.string().optional(),
    distinctiveFeatures: external_exports.string().optional()
  }).optional(),
  colorPalette: external_exports.array(external_exports.string()).optional(),
  cinematography: external_exports.object({
    cameraStyle: external_exports.string().optional(),
    lightingStyle: external_exports.string().optional()
  }).optional(),
  // Kling v3 Pro parameters
  klingAspectRatio: external_exports.enum(["16:9", "9:16", "1:1"]).optional(),
  klingDuration: external_exports.enum(["3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"]).optional(),
  klingTier: external_exports.enum(["pro", "standard"]).optional(),
  klingReferenceImage: external_exports.string().optional(),
  klingCustomInstructions: external_exports.string().optional(),
  klingElementBinding: external_exports.boolean().optional(),
  klingUseMultiPrompt: external_exports.boolean().optional(),
  // OmniHuman 1.5 parameters
  omniReferenceImage: external_exports.string().optional(),
  omniAudioUrl: external_exports.string().optional(),
  omniResolution: external_exports.enum(["720p", "1080p"]).optional(),
  omniVoiceId: external_exports.string().optional()
});
var vspPublishToPostBridgeSchema = external_exports.object({
  socialAccountIds: external_exports.array(external_exports.number()).min(1),
  scheduledAt: external_exports.string().optional(),
  platformConfigurations: external_exports.object({
    tiktok: external_exports.object({ title: external_exports.string().optional(), caption: external_exports.string().optional() }).optional(),
    instagram: external_exports.object({ caption: external_exports.string().optional(), placement: external_exports.enum(["feed", "reels"]).optional() }).optional(),
    youtube: external_exports.object({ title: external_exports.string().optional(), caption: external_exports.string().optional() }).optional()
  }).optional()
});
var ciCompetitors = pgTable("ci_competitors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  handle: text("handle").notNull().unique(),
  displayName: text("display_name"),
  platform: text("platform").notNull().default("tiktok"),
  isActive: boolean("is_active").default(true),
  lastScrapedAt: text("last_scraped_at"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`now()`)
});
var insertCiCompetitorSchema = createInsertSchema(ciCompetitors).omit({ id: true, createdAt: true });
var ciScrapedVideos = pgTable("ci_scraped_videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitorId: varchar("competitor_id").notNull().references(() => ciCompetitors.id, { onDelete: "cascade" }),
  externalVideoId: text("external_video_id").notNull().unique(),
  url: text("url").notNull(),
  caption: text("caption"),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  shareCount: integer("share_count").default(0),
  duration: integer("duration"),
  postedAt: text("posted_at"),
  transcript: text("transcript"),
  transcriptStatus: text("transcript_status").notNull().default("pending"),
  analysisStatus: text("analysis_status").notNull().default("pending"),
  briefStatus: text("brief_status").notNull().default("pending"),
  metadata: jsonb("metadata"),
  scrapedAt: text("scraped_at").notNull().default(sql`now()`),
  createdAt: text("created_at").notNull().default(sql`now()`)
});
var insertCiScrapedVideoSchema = createInsertSchema(ciScrapedVideos).omit({ id: true, createdAt: true, scrapedAt: true });
var ciVideoAnalyses = pgTable("ci_video_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scrapedVideoId: varchar("scraped_video_id").notNull().references(() => ciScrapedVideos.id, { onDelete: "cascade" }),
  blocked: boolean("blocked").default(false),
  blockReason: text("block_reason"),
  topicCategory: text("topic_category"),
  topicSummary: text("topic_summary"),
  hookText: text("hook_text"),
  hookType: text("hook_type"),
  hookSummary: text("hook_summary"),
  emotionalAngle: text("emotional_angle"),
  targetAudience: text("target_audience"),
  format: text("format"),
  ctaType: text("cta_type"),
  replicationScore: integer("replication_score"),
  notes: text("notes"),
  rawAnalysis: jsonb("raw_analysis"),
  weekAdded: text("week_added"),
  createdAt: text("created_at").notNull().default(sql`now()`)
});
var insertCiVideoAnalysisSchema = createInsertSchema(ciVideoAnalyses).omit({ id: true, createdAt: true });
var ciContentBriefs = pgTable("ci_content_briefs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weekLabel: text("week_label").notNull(),
  briefData: jsonb("brief_data").notNull(),
  topTopics: jsonb("top_topics"),
  topHookTypes: jsonb("top_hook_types"),
  topEmotionalAngles: jsonb("top_emotional_angles"),
  videoCount: integer("video_count").default(0),
  status: text("status").notNull().default("draft"),
  createdAt: text("created_at").notNull().default(sql`now()`)
});
var insertCiContentBriefSchema = createInsertSchema(ciContentBriefs).omit({ id: true, createdAt: true });
var ciBriefScripts = pgTable("ci_brief_scripts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  briefId: varchar("brief_id").notNull().references(() => ciContentBriefs.id, { onDelete: "cascade" }),
  briefItemIndex: integer("brief_item_index"),
  title: text("title").notNull(),
  hook: text("hook"),
  body: text("body"),
  closeCta: text("close_cta"),
  creatorName: text("creator_name"),
  creatorStyle: text("creator_style"),
  platform: text("platform"),
  duration: text("duration"),
  rawScript: jsonb("raw_script"),
  status: text("status").notNull().default("draft"),
  videoRequestId: varchar("video_request_id"),
  createdAt: text("created_at").notNull().default(sql`now()`)
});
var insertCiBriefScriptSchema = createInsertSchema(ciBriefScripts).omit({ id: true, createdAt: true });
var ciPerformanceReports = pgTable("ci_performance_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weekLabel: text("week_label").notNull(),
  ownVideosData: jsonb("own_videos_data"),
  matchingBriefs: jsonb("matching_briefs"),
  topPerformingTopics: jsonb("top_performing_topics"),
  topPerformingHookTypes: jsonb("top_performing_hook_types"),
  underperformingTopics: jsonb("underperforming_topics"),
  patterns: text("patterns"),
  recommendation: text("recommendation"),
  rawReport: jsonb("raw_report"),
  createdAt: text("created_at").notNull().default(sql`now()`)
});
var insertCiPerformanceReportSchema = createInsertSchema(ciPerformanceReports).omit({ id: true, createdAt: true });
var ciSettings = pgTable("ci_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  category: text("category").notNull().default("general"),
  label: text("label"),
  description: text("description"),
  valueType: text("value_type").notNull().default("text"),
  updatedAt: text("updated_at").notNull().default(sql`now()`)
});
var insertCiSettingSchema = createInsertSchema(ciSettings).omit({ id: true, updatedAt: true });
var socialPosts = pgTable("social_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull().default("single"),
  // 'single' or 'carousel'
  platform: text("platform").notNull().default("both"),
  // 'instagram', 'tiktok', 'both'
  topic: text("topic"),
  caption: text("caption"),
  hashtags: text("hashtags"),
  status: text("status").notNull().default("draft"),
  // 'draft', 'scheduled', 'publishing', 'published', 'failed'
  scheduledAt: text("scheduled_at"),
  publishedAt: text("published_at"),
  error: text("error"),
  carouselTypeId: varchar("carousel_type_id"),
  templateSetId: varchar("template_set_id"),
  slideCount: integer("slide_count").default(5),
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").notNull().default(sql`now()`)
});
var insertSocialPostSchema = createInsertSchema(socialPosts).omit({ id: true, createdAt: true, updatedAt: true });
var socialPostSlides = pgTable("social_post_slides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => socialPosts.id, { onDelete: "cascade" }).notNull(),
  slideOrder: integer("slide_order").notNull(),
  templateType: text("template_type").notNull().default("content"),
  // 'single', 'cover', 'content', 'cta'
  title: text("title"),
  bodyText: text("body_text"),
  imageUrl: text("image_url"),
  backgroundImageUrl: text("background_image_url"),
  imagePrompt: text("image_prompt"),
  platformUrls: json("platform_urls"),
  // { instagram: "url", tiktok: "url" }
  createdAt: text("created_at").notNull().default(sql`now()`)
});
var insertSocialPostSlideSchema = createInsertSchema(socialPostSlides).omit({ id: true, createdAt: true });
var socialCarouselTypes = pgTable("social_carousel_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  emoji: text("emoji").default(""),
  description: text("description"),
  topicPrompt: text("topic_prompt"),
  contentPrompt: text("content_prompt"),
  captionPrompt: text("caption_prompt"),
  active: boolean("active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at").notNull().default(sql`now()`)
});
var insertSocialCarouselTypeSchema = createInsertSchema(socialCarouselTypes).omit({ id: true, createdAt: true });
var socialTemplateSets = pgTable("social_template_sets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  imagePromptTemplate: text("image_prompt_template"),
  active: boolean("active").default(true),
  igFontScale: text("ig_font_scale").default("1.0"),
  watermark: text("watermark"),
  watermarkImage: text("watermark_image"),
  watermarkPosition: text("watermark_position").default("bottom-right"),
  watermarkSize: integer("watermark_size").default(40),
  watermarkOpacity: text("watermark_opacity").default("0.7"),
  createdAt: text("created_at").notNull().default(sql`now()`)
});
var insertSocialTemplateSetSchema = createInsertSchema(socialTemplateSets).omit({ id: true, createdAt: true });
var socialSlideTemplates = pgTable("social_slide_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  // 'single', 'cover', 'content', 'cta'
  setName: text("set_name").notNull(),
  config: json("config").notNull(),
  // { bg_gradient, text_color, accent_color, font, text_mode, etc. }
  imagePromptTemplate: text("image_prompt_template"),
  active: boolean("active").default(true),
  createdAt: text("created_at").notNull().default(sql`now()`)
});
var insertSocialSlideTemplateSchema = createInsertSchema(socialSlideTemplates).omit({ id: true, createdAt: true });
var socialMediaLibrary = pgTable("social_media_library", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  prompt: text("prompt"),
  tags: json("tags"),
  // string[]
  source: text("source").default("ai"),
  // 'ai', 'upload', 'unsplash'
  createdAt: text("created_at").notNull().default(sql`now()`)
});
var insertSocialMediaLibrarySchema = createInsertSchema(socialMediaLibrary).omit({ id: true, createdAt: true });

// server/storage.ts
import { randomUUID } from "crypto";

// node_modules/pg/esm/index.mjs
var import_lib = __toESM(require_lib2(), 1);
var Client = import_lib.default.Client;
var Pool = import_lib.default.Pool;
var Connection = import_lib.default.Connection;
var types = import_lib.default.types;
var Query = import_lib.default.Query;
var DatabaseError = import_lib.default.DatabaseError;
var escapeIdentifier = import_lib.default.escapeIdentifier;
var escapeLiteral = import_lib.default.escapeLiteral;
var Result = import_lib.default.Result;
var TypeOverrides = import_lib.default.TypeOverrides;
var defaults = import_lib.default.defaults;
var esm_default = import_lib.default;

// node_modules/drizzle-orm/node-postgres/session.js
var { Pool: Pool2, types: types2 } = esm_default;
var NodePgPreparedQuery = class extends PgPreparedQuery {
  constructor(client, queryString, params, logger, fields, name, _isResponseInArrayMode, customResultMapper) {
    super({ sql: queryString, params });
    this.client = client;
    this.params = params;
    this.logger = logger;
    this.fields = fields;
    this._isResponseInArrayMode = _isResponseInArrayMode;
    this.customResultMapper = customResultMapper;
    this.rawQueryConfig = {
      name,
      text: queryString,
      types: {
        // @ts-ignore
        getTypeParser: (typeId, format) => {
          if (typeId === types2.builtins.TIMESTAMPTZ) {
            return (val) => val;
          }
          if (typeId === types2.builtins.TIMESTAMP) {
            return (val) => val;
          }
          if (typeId === types2.builtins.DATE) {
            return (val) => val;
          }
          if (typeId === types2.builtins.INTERVAL) {
            return (val) => val;
          }
          return types2.getTypeParser(typeId, format);
        }
      }
    };
    this.queryConfig = {
      name,
      text: queryString,
      rowMode: "array",
      types: {
        // @ts-ignore
        getTypeParser: (typeId, format) => {
          if (typeId === types2.builtins.TIMESTAMPTZ) {
            return (val) => val;
          }
          if (typeId === types2.builtins.TIMESTAMP) {
            return (val) => val;
          }
          if (typeId === types2.builtins.DATE) {
            return (val) => val;
          }
          if (typeId === types2.builtins.INTERVAL) {
            return (val) => val;
          }
          return types2.getTypeParser(typeId, format);
        }
      }
    };
  }
  static [entityKind] = "NodePgPreparedQuery";
  rawQueryConfig;
  queryConfig;
  async execute(placeholderValues = {}) {
    return tracer.startActiveSpan("drizzle.execute", async () => {
      const params = fillPlaceholders(this.params, placeholderValues);
      this.logger.logQuery(this.rawQueryConfig.text, params);
      const { fields, rawQueryConfig: rawQuery, client, queryConfig: query, joinsNotNullableMap, customResultMapper } = this;
      if (!fields && !customResultMapper) {
        return tracer.startActiveSpan("drizzle.driver.execute", async (span) => {
          span?.setAttributes({
            "drizzle.query.name": rawQuery.name,
            "drizzle.query.text": rawQuery.text,
            "drizzle.query.params": JSON.stringify(params)
          });
          return client.query(rawQuery, params);
        });
      }
      const result = await tracer.startActiveSpan("drizzle.driver.execute", (span) => {
        span?.setAttributes({
          "drizzle.query.name": query.name,
          "drizzle.query.text": query.text,
          "drizzle.query.params": JSON.stringify(params)
        });
        return client.query(query, params);
      });
      return tracer.startActiveSpan("drizzle.mapResponse", () => {
        return customResultMapper ? customResultMapper(result.rows) : result.rows.map((row) => mapResultRow(fields, row, joinsNotNullableMap));
      });
    });
  }
  all(placeholderValues = {}) {
    return tracer.startActiveSpan("drizzle.execute", () => {
      const params = fillPlaceholders(this.params, placeholderValues);
      this.logger.logQuery(this.rawQueryConfig.text, params);
      return tracer.startActiveSpan("drizzle.driver.execute", (span) => {
        span?.setAttributes({
          "drizzle.query.name": this.rawQueryConfig.name,
          "drizzle.query.text": this.rawQueryConfig.text,
          "drizzle.query.params": JSON.stringify(params)
        });
        return this.client.query(this.rawQueryConfig, params).then((result) => result.rows);
      });
    });
  }
  /** @internal */
  isResponseInArrayMode() {
    return this._isResponseInArrayMode;
  }
};
var NodePgSession = class _NodePgSession extends PgSession {
  constructor(client, dialect, schema, options = {}) {
    super(dialect);
    this.client = client;
    this.schema = schema;
    this.options = options;
    this.logger = options.logger ?? new NoopLogger();
  }
  static [entityKind] = "NodePgSession";
  logger;
  prepareQuery(query, fields, name, isResponseInArrayMode, customResultMapper) {
    return new NodePgPreparedQuery(
      this.client,
      query.sql,
      query.params,
      this.logger,
      fields,
      name,
      isResponseInArrayMode,
      customResultMapper
    );
  }
  async transaction(transaction, config) {
    const session = this.client instanceof Pool2 ? new _NodePgSession(await this.client.connect(), this.dialect, this.schema, this.options) : this;
    const tx = new NodePgTransaction(this.dialect, session, this.schema);
    await tx.execute(sql`begin${config ? sql` ${tx.getTransactionConfigSQL(config)}` : void 0}`);
    try {
      const result = await transaction(tx);
      await tx.execute(sql`commit`);
      return result;
    } catch (error) {
      await tx.execute(sql`rollback`);
      throw error;
    } finally {
      if (this.client instanceof Pool2) {
        session.client.release();
      }
    }
  }
  async count(sql2) {
    const res = await this.execute(sql2);
    return Number(
      res["rows"][0]["count"]
    );
  }
};
var NodePgTransaction = class _NodePgTransaction extends PgTransaction {
  static [entityKind] = "NodePgTransaction";
  async transaction(transaction) {
    const savepointName = `sp${this.nestedIndex + 1}`;
    const tx = new _NodePgTransaction(
      this.dialect,
      this.session,
      this.schema,
      this.nestedIndex + 1
    );
    await tx.execute(sql.raw(`savepoint ${savepointName}`));
    try {
      const result = await transaction(tx);
      await tx.execute(sql.raw(`release savepoint ${savepointName}`));
      return result;
    } catch (err) {
      await tx.execute(sql.raw(`rollback to savepoint ${savepointName}`));
      throw err;
    }
  }
};

// node_modules/drizzle-orm/node-postgres/driver.js
var NodePgDriver = class {
  constructor(client, dialect, options = {}) {
    this.client = client;
    this.dialect = dialect;
    this.options = options;
  }
  static [entityKind] = "NodePgDriver";
  createSession(schema) {
    return new NodePgSession(this.client, this.dialect, schema, { logger: this.options.logger });
  }
};
var NodePgDatabase = class extends PgDatabase {
  static [entityKind] = "NodePgDatabase";
};
function construct(client, config = {}) {
  const dialect = new PgDialect({ casing: config.casing });
  let logger;
  if (config.logger === true) {
    logger = new DefaultLogger();
  } else if (config.logger !== false) {
    logger = config.logger;
  }
  let schema;
  if (config.schema) {
    const tablesConfig = extractTablesRelationalConfig(
      config.schema,
      createTableRelationsHelpers
    );
    schema = {
      fullSchema: config.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap
    };
  }
  const driver = new NodePgDriver(client, dialect, { logger });
  const session = driver.createSession(schema);
  const db2 = new NodePgDatabase(dialect, session, schema);
  db2.$client = client;
  return db2;
}
function drizzle(...params) {
  if (typeof params[0] === "string") {
    const instance = new esm_default.Pool({
      connectionString: params[0]
    });
    return construct(instance, params[1]);
  }
  if (isConfig(params[0])) {
    const { connection, client, ...drizzleConfig } = params[0];
    if (client)
      return construct(client, drizzleConfig);
    const instance = typeof connection === "string" ? new esm_default.Pool({
      connectionString: connection
    }) : new esm_default.Pool(connection);
    return construct(instance, drizzleConfig);
  }
  return construct(params[0], params[1]);
}
((drizzle2) => {
  function mock(config) {
    return construct({}, config);
  }
  drizzle2.mock = mock;
})(drizzle || (drizzle = {}));

// server/db.ts
var { Pool: Pool3 } = esm_default;
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}
var pool = new Pool3({
  connectionString: process.env.DATABASE_URL
});
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
var DatabaseStorage = class {
  // Users
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  // Articles
  async getArticles() {
    return db.select().from(articles).orderBy(desc(articles.updatedAt));
  }
  async getArticle(id) {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }
  async createArticle(insertArticle) {
    const [article] = await db.insert(articles).values(insertArticle).returning();
    return article;
  }
  async updateArticle(id, updates) {
    const [article] = await db.update(articles).set({ ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(eq(articles.id, id)).returning();
    return article;
  }
  async deleteArticle(id) {
    const result = await db.delete(articles).where(eq(articles.id, id));
    return true;
  }
  // Keywords
  async getKeywords() {
    return db.select().from(keywords).orderBy(desc(keywords.clicks));
  }
  async getKeyword(id) {
    const [keyword] = await db.select().from(keywords).where(eq(keywords.id, id));
    return keyword;
  }
  async createKeyword(insertKeyword) {
    const [keyword] = await db.insert(keywords).values(insertKeyword).returning();
    return keyword;
  }
  async updateKeyword(id, updates) {
    const [keyword] = await db.update(keywords).set({ ...updates, lastUpdated: (/* @__PURE__ */ new Date()).toISOString() }).where(eq(keywords.id, id)).returning();
    return keyword;
  }
  async deleteKeyword(id) {
    await db.delete(keywords).where(eq(keywords.id, id));
    return true;
  }
  // Integrations
  async getIntegrations() {
    return db.select().from(integrations);
  }
  async getIntegration(name) {
    const [integration] = await db.select().from(integrations).where(eq(integrations.name, name));
    return integration;
  }
  async upsertIntegration(insertIntegration) {
    const existing = await this.getIntegration(insertIntegration.name);
    if (existing) {
      const [updated] = await db.update(integrations).set(insertIntegration).where(eq(integrations.name, insertIntegration.name)).returning();
      return updated;
    }
    const [integration] = await db.insert(integrations).values(insertIntegration).returning();
    return integration;
  }
  // Content Suggestions
  async getSuggestionsByArticle(articleId) {
    return db.select().from(contentSuggestions).where(eq(contentSuggestions.articleId, articleId));
  }
  async createSuggestion(insertSuggestion) {
    const [suggestion] = await db.insert(contentSuggestions).values(insertSuggestion).returning();
    return suggestion;
  }
  async updateSuggestion(id, applied) {
    const [suggestion] = await db.update(contentSuggestions).set({ applied }).where(eq(contentSuggestions.id, id)).returning();
    return suggestion;
  }
  // Analytics
  async getAnalyticsSnapshots(days) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
    return db.select().from(analyticsSnapshots).where(gte(analyticsSnapshots.date, cutoffDate)).orderBy(analyticsSnapshots.date);
  }
  async createAnalyticsSnapshot(insertSnapshot) {
    const [snapshot] = await db.insert(analyticsSnapshots).values(insertSnapshot).returning();
    return snapshot;
  }
  // Writing Styles
  async getWritingStyles() {
    return db.select().from(writingStyles).orderBy(writingStyles.name);
  }
  async getWritingStyle(id) {
    const [style] = await db.select().from(writingStyles).where(eq(writingStyles.id, id));
    return style;
  }
  async createWritingStyle(insertStyle) {
    const [style] = await db.insert(writingStyles).values(insertStyle).returning();
    return style;
  }
  async updateWritingStyle(id, updates) {
    const [style] = await db.update(writingStyles).set(updates).where(eq(writingStyles.id, id)).returning();
    return style;
  }
  async deleteWritingStyle(id) {
    await db.delete(writingStyles).where(eq(writingStyles.id, id));
    return true;
  }
  // Optimization Prompts
  async getOptimizationPrompts() {
    return db.select().from(optimizationPrompts).orderBy(optimizationPrompts.name);
  }
  async getOptimizationPrompt(id) {
    const [prompt] = await db.select().from(optimizationPrompts).where(eq(optimizationPrompts.id, id));
    return prompt;
  }
  async createOptimizationPrompt(insertPrompt) {
    const [prompt] = await db.insert(optimizationPrompts).values(insertPrompt).returning();
    return prompt;
  }
  async updateOptimizationPrompt(id, updates) {
    const [prompt] = await db.update(optimizationPrompts).set(updates).where(eq(optimizationPrompts.id, id)).returning();
    return prompt;
  }
  async deleteOptimizationPrompt(id) {
    await db.delete(optimizationPrompts).where(eq(optimizationPrompts.id, id));
    return true;
  }
  // SEO Settings
  async getSeoSettings() {
    const [settings] = await db.select().from(seoSettings).limit(1);
    return settings;
  }
  async upsertSeoSettings(insertSettings) {
    const existing = await this.getSeoSettings();
    if (existing) {
      const [updated] = await db.update(seoSettings).set({ ...insertSettings, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(eq(seoSettings.id, existing.id)).returning();
      return updated;
    }
    const [settings] = await db.insert(seoSettings).values(insertSettings).returning();
    return settings;
  }
  // Image Styles
  async getImageStyles() {
    return db.select().from(imageStyles).orderBy(imageStyles.name);
  }
  async getImageStyle(id) {
    const [style] = await db.select().from(imageStyles).where(eq(imageStyles.id, id));
    return style;
  }
  async createImageStyle(insertStyle) {
    const [style] = await db.insert(imageStyles).values(insertStyle).returning();
    return style;
  }
  async updateImageStyle(id, updates) {
    const [style] = await db.update(imageStyles).set(updates).where(eq(imageStyles.id, id)).returning();
    return style;
  }
  async deleteImageStyle(id) {
    await db.delete(imageStyles).where(eq(imageStyles.id, id));
    return true;
  }
  // Target Audiences
  async getTargetAudiences() {
    return db.select().from(targetAudiences).orderBy(targetAudiences.name);
  }
  async getTargetAudience(id) {
    const [audience] = await db.select().from(targetAudiences).where(eq(targetAudiences.id, id));
    return audience;
  }
  async createTargetAudience(insertAudience) {
    const [audience] = await db.insert(targetAudiences).values(insertAudience).returning();
    return audience;
  }
  async updateTargetAudience(id, updates) {
    const [audience] = await db.update(targetAudiences).set(updates).where(eq(targetAudiences.id, id)).returning();
    return audience;
  }
  async deleteTargetAudience(id) {
    await db.delete(targetAudiences).where(eq(targetAudiences.id, id));
    return true;
  }
  // Link Table Columns
  async getLinkTableColumns() {
    return db.select().from(linkTableColumns).orderBy(linkTableColumns.order);
  }
  async createLinkTableColumn(column) {
    const [created] = await db.insert(linkTableColumns).values(column).returning();
    return created;
  }
  async updateLinkTableColumn(id, column) {
    const [updated] = await db.update(linkTableColumns).set(column).where(eq(linkTableColumns.id, id)).returning();
    return updated;
  }
  async deleteLinkTableColumn(id) {
    await db.delete(linkTableColumns).where(eq(linkTableColumns.id, id));
    return true;
  }
  // Site URLs (rows)
  async getSiteUrls() {
    return db.select().from(siteUrls).orderBy(siteUrls.createdAt);
  }
  async getSiteUrl(id) {
    const [url] = await db.select().from(siteUrls).where(eq(siteUrls.id, id));
    return url;
  }
  async createSiteUrl(siteUrl) {
    const [created] = await db.insert(siteUrls).values(siteUrl).returning();
    return created;
  }
  async updateSiteUrl(id, siteUrl) {
    const [updated] = await db.update(siteUrls).set(siteUrl).where(eq(siteUrls.id, id)).returning();
    return updated;
  }
  async deleteSiteUrl(id) {
    await db.delete(siteUrls).where(eq(siteUrls.id, id));
    return true;
  }
  // Optimization Analyses
  async getOptimizationAnalyses() {
    return db.select().from(optimizationAnalyses).orderBy(desc(optimizationAnalyses.createdAt));
  }
  async getOptimizationAnalysis(id) {
    const [analysis] = await db.select().from(optimizationAnalyses).where(eq(optimizationAnalyses.id, id));
    return analysis;
  }
  async createOptimizationAnalysis(insertAnalysis) {
    const [analysis] = await db.insert(optimizationAnalyses).values(insertAnalysis).returning();
    return analysis;
  }
  async updateOptimizationAnalysisContent(id, htmlContent) {
    const existing = await this.getOptimizationAnalysis(id);
    if (!existing) return void 0;
    const updatedPageContent = {
      ...existing.pageContent,
      htmlContent
    };
    const [analysis] = await db.update(optimizationAnalyses).set({ pageContent: updatedPageContent }).where(eq(optimizationAnalyses.id, id)).returning();
    return analysis;
  }
  async deleteOptimizationAnalysis(id) {
    await db.delete(optimizationAnalyses).where(eq(optimizationAnalyses.id, id));
    return true;
  }
  async updateOptimizationAnalysisRecommendations(id, recommendations) {
    const [analysis] = await db.update(optimizationAnalyses).set({ recommendations }).where(eq(optimizationAnalyses.id, id)).returning();
    return analysis;
  }
  // Horoscope Prompts
  async getHoroscopePrompts() {
    return db.select().from(horoscopePrompts).orderBy(horoscopePrompts.type);
  }
  async getHoroscopePrompt(id) {
    const [prompt] = await db.select().from(horoscopePrompts).where(eq(horoscopePrompts.id, id));
    return prompt;
  }
  async getHoroscopePromptByTypeAndLanguage(type, language, site = "psychicsource") {
    const results = await db.select().from(horoscopePrompts);
    return results.find((p) => p.type === type && p.language === language && p.site === site && p.isActive);
  }
  async createHoroscopePrompt(prompt) {
    const [created] = await db.insert(horoscopePrompts).values(prompt).returning();
    return created;
  }
  async updateHoroscopePrompt(id, updates) {
    const [updated] = await db.update(horoscopePrompts).set({ ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(eq(horoscopePrompts.id, id)).returning();
    return updated;
  }
  async deleteHoroscopePrompt(id) {
    await db.delete(horoscopePrompts).where(eq(horoscopePrompts.id, id));
    return true;
  }
  // Horoscope Entries
  async getHoroscopeEntries(type, language, site) {
    const all = await db.select().from(horoscopeEntries).orderBy(desc(horoscopeEntries.createdAt));
    return all.filter((e) => {
      if (type && e.type !== type) return false;
      if (language && e.language !== language) return false;
      if (site && e.site !== site) return false;
      return true;
    });
  }
  async getHoroscopeEntry(id) {
    const [entry] = await db.select().from(horoscopeEntries).where(eq(horoscopeEntries.id, id));
    return entry;
  }
  async getHoroscopeEntriesByPeriod(type, language, periodStart, site = "psychicsource") {
    const all = await db.select().from(horoscopeEntries);
    return all.filter((e) => e.type === type && e.language === language && e.periodStart === periodStart && e.site === site);
  }
  async createHoroscopeEntry(entry) {
    const [created] = await db.insert(horoscopeEntries).values(entry).returning();
    return created;
  }
  async updateHoroscopeEntry(id, updates) {
    const [updated] = await db.update(horoscopeEntries).set(updates).where(eq(horoscopeEntries.id, id)).returning();
    return updated;
  }
  async deleteHoroscopeEntry(id) {
    await db.delete(horoscopeEntries).where(eq(horoscopeEntries.id, id));
    return true;
  }
  async deleteHoroscopeEntriesByPeriod(type, language, periodStart, site = "psychicsource") {
    const entries = await this.getHoroscopeEntriesByPeriod(type, language, periodStart, site);
    for (const entry of entries) {
      await db.delete(horoscopeEntries).where(eq(horoscopeEntries.id, entry.id));
    }
    return true;
  }
  // Psychics
  async getPsychics() {
    return db.select().from(psychics).orderBy(psychics.name);
  }
  async getPsychic(id) {
    const [psychic] = await db.select().from(psychics).where(eq(psychics.id, id));
    return psychic;
  }
  async getPsychicByFirebaseUid(uid) {
    const [psychic] = await db.select().from(psychics).where(eq(psychics.firebaseUid, uid));
    return psychic;
  }
  async createPsychic(psychic) {
    const [created] = await db.insert(psychics).values(psychic).returning();
    return created;
  }
  async updatePsychic(id, updates) {
    const [updated] = await db.update(psychics).set(updates).where(eq(psychics.id, id)).returning();
    return updated;
  }
  async deletePsychic(id) {
    await db.delete(psychics).where(eq(psychics.id, id));
    return true;
  }
  // Video Requests
  async getVideoRequests(status) {
    const all = await db.select().from(videoRequests).orderBy(desc(videoRequests.createdAt));
    if (status) return all.filter((r) => r.status === status);
    return all;
  }
  async getVideoRequest(id) {
    const [request] = await db.select().from(videoRequests).where(eq(videoRequests.id, id));
    return request;
  }
  async getVideoRequestsByPsychic(psychicId) {
    const all = await db.select().from(videoRequests).orderBy(desc(videoRequests.createdAt));
    return all.filter((r) => r.claimedBy === psychicId);
  }
  async createVideoRequest(request) {
    const [created] = await db.insert(videoRequests).values(request).returning();
    return created;
  }
  async updateVideoRequest(id, updates) {
    const [updated] = await db.update(videoRequests).set({ ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(eq(videoRequests.id, id)).returning();
    return updated;
  }
  /**
   * Atomically claim a video request only if it is currently `available`. Returns the
   * updated row on success, or undefined if the request was not available (e.g. already
   * claimed by someone else in a race). Use this instead of read-then-update in the claim
   * endpoint to avoid two psychics both succeeding on the same request.
   */
  async claimVideoRequest(id, psychicId, extras = {}) {
    const [updated] = await db.update(videoRequests).set({
      status: "claimed",
      claimedBy: psychicId,
      claimedAt: (/* @__PURE__ */ new Date()).toISOString(),
      ...extras,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }).where(and(eq(videoRequests.id, id), eq(videoRequests.status, "available"))).returning();
    return updated;
  }
  async deleteVideoRequest(id) {
    await db.delete(videoRequests).where(eq(videoRequests.id, id));
    return true;
  }
  // Video Messages
  async getVideoMessages(videoRequestId) {
    const all = await db.select().from(videoMessages).orderBy(videoMessages.createdAt);
    return all.filter((m) => m.videoRequestId === videoRequestId);
  }
  async createVideoMessage(message) {
    const [created] = await db.insert(videoMessages).values(message).returning();
    return created;
  }
  // Video Captions
  async getVideoCaptions(videoRequestId) {
    const all = await db.select().from(videoCaptions).orderBy(desc(videoCaptions.createdAt));
    return all.filter((c) => c.videoRequestId === videoRequestId);
  }
  async createVideoCaption(caption) {
    const [created] = await db.insert(videoCaptions).values(caption).returning();
    return created;
  }
  async deleteVideoCaption(id) {
    await db.delete(videoCaptions).where(eq(videoCaptions.id, id));
    return true;
  }
  // Video Caption Prompts
  async getVideoCaptionPrompts() {
    return db.select().from(videoCaptionPrompts).orderBy(videoCaptionPrompts.platform);
  }
  async getVideoCaptionPrompt(id) {
    const [prompt] = await db.select().from(videoCaptionPrompts).where(eq(videoCaptionPrompts.id, id));
    return prompt;
  }
  async getVideoCaptionPromptByPlatform(platform) {
    const all = await db.select().from(videoCaptionPrompts);
    return all.find((p) => p.platform === platform && p.isActive);
  }
  async createVideoCaptionPrompt(prompt) {
    const [created] = await db.insert(videoCaptionPrompts).values(prompt).returning();
    return created;
  }
  async updateVideoCaptionPrompt(id, updates) {
    const [updated] = await db.update(videoCaptionPrompts).set({ ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(eq(videoCaptionPrompts.id, id)).returning();
    return updated;
  }
  async deleteVideoCaptionPrompt(id) {
    await db.delete(videoCaptionPrompts).where(eq(videoCaptionPrompts.id, id));
    return true;
  }
  // ===== VSP Content Projects =====
  async getVspProjects() {
    const results = await db.select({
      id: vspContentProjects.id,
      category: vspContentProjects.category,
      subtopic: vspContentProjects.subtopic,
      campaignId: vspContentProjects.campaignId,
      scheduledDate: vspContentProjects.scheduledDate,
      publishedDate: vspContentProjects.publishedDate,
      priority: vspContentProjects.priority,
      isTemplate: vspContentProjects.isTemplate,
      script: vspContentProjects.script,
      caption: vspContentProjects.caption,
      revidProjectId: vspContentProjects.revidProjectId,
      veoOperationName: vspContentProjects.veoOperationName,
      status: vspContentProjects.status,
      analytics: vspContentProjects.analytics,
      createdAt: vspContentProjects.createdAt,
      updatedAt: vspContentProjects.updatedAt
    }).from(vspContentProjects).orderBy(desc(vspContentProjects.updatedAt));
    return results.map((project) => ({
      ...project,
      videoUrl: null,
      videoSettings: null,
      script: project.script,
      caption: project.caption,
      analytics: project.analytics
    }));
  }
  async getVspProject(id) {
    const [project] = await db.select().from(vspContentProjects).where(eq(vspContentProjects.id, id));
    if (!project) return void 0;
    return {
      ...project,
      script: project.script,
      caption: project.caption,
      videoSettings: project.videoSettings,
      analytics: project.analytics
    };
  }
  async getVspProjectsByDateRange(startDate, endDate) {
    const results = await db.select().from(vspContentProjects).where(and(
      gte(vspContentProjects.scheduledDate, startDate),
      lte(vspContentProjects.scheduledDate, endDate)
    )).orderBy(vspContentProjects.scheduledDate);
    return results.map((project) => ({
      ...project,
      script: project.script,
      caption: project.caption,
      videoSettings: project.videoSettings,
      analytics: project.analytics
    }));
  }
  async createVspProject(insertProject) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const projectData = {
      id,
      category: insertProject.category,
      subtopic: insertProject.subtopic,
      script: insertProject.script ?? null,
      caption: insertProject.caption ?? null,
      videoSettings: insertProject.videoSettings ?? null,
      videoUrl: insertProject.videoUrl ?? null,
      revidProjectId: null,
      status: insertProject.status ?? "draft",
      createdAt: now,
      updatedAt: now
    };
    const [result] = await db.insert(vspContentProjects).values(projectData).returning();
    return {
      ...result,
      script: result.script,
      caption: result.caption,
      videoSettings: result.videoSettings,
      analytics: result.analytics
    };
  }
  async updateVspProject(id, updates) {
    const [result] = await db.update(vspContentProjects).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(vspContentProjects.id, id)).returning();
    if (!result) return void 0;
    return {
      ...result,
      script: result.script,
      caption: result.caption,
      videoSettings: result.videoSettings,
      analytics: result.analytics
    };
  }
  async deleteVspProject(id) {
    const results = await db.delete(vspContentProjects).where(eq(vspContentProjects.id, id)).returning();
    return results.length > 0;
  }
  // ===== VSP Campaigns =====
  async getVspCampaigns() {
    const results = await db.select().from(vspCampaigns).orderBy(desc(vspCampaigns.createdAt));
    return results.map((campaign) => ({
      ...campaign,
      goals: campaign.goals
    }));
  }
  async getVspCampaign(id) {
    const [campaign] = await db.select().from(vspCampaigns).where(eq(vspCampaigns.id, id));
    if (!campaign) return void 0;
    return {
      ...campaign,
      goals: campaign.goals
    };
  }
  async getVspActiveCampaigns() {
    const results = await db.select().from(vspCampaigns).where(eq(vspCampaigns.status, "active")).orderBy(vspCampaigns.startDate);
    return results.map((campaign) => ({
      ...campaign,
      goals: campaign.goals
    }));
  }
  async createVspCampaign(insertCampaign) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const campaignData = {
      id,
      name: insertCampaign.name,
      description: insertCampaign.description ?? null,
      startDate: insertCampaign.startDate,
      endDate: insertCampaign.endDate,
      status: insertCampaign.status ?? "planning",
      goals: insertCampaign.goals ?? null,
      color: insertCampaign.color ?? "#3b82f6",
      createdAt: now,
      updatedAt: now
    };
    const [result] = await db.insert(vspCampaigns).values(campaignData).returning();
    return {
      ...result,
      goals: result.goals
    };
  }
  async updateVspCampaign(id, updates) {
    const [result] = await db.update(vspCampaigns).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(vspCampaigns.id, id)).returning();
    if (!result) return void 0;
    return {
      ...result,
      goals: result.goals
    };
  }
  async deleteVspCampaign(id) {
    await db.delete(vspContentProjects).where(eq(vspContentProjects.campaignId, id));
    const results = await db.delete(vspCampaigns).where(eq(vspCampaigns.id, id)).returning();
    return results.length > 0;
  }
  // ===== VSP Content Calendar =====
  async getVspContentCalendarEvents() {
    return db.select().from(vspContentCalendar).orderBy(vspContentCalendar.scheduledDate);
  }
  async getVspContentCalendarEventsByDateRange(startDate, endDate) {
    return db.select().from(vspContentCalendar).where(and(
      gte(vspContentCalendar.scheduledDate, startDate),
      lte(vspContentCalendar.scheduledDate, endDate)
    )).orderBy(vspContentCalendar.scheduledDate);
  }
  async createVspContentCalendarEvent(insertEvent) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const eventData = {
      id,
      title: insertEvent.title,
      description: insertEvent.description ?? null,
      scheduledDate: insertEvent.scheduledDate,
      category: insertEvent.category,
      subtopic: insertEvent.subtopic,
      campaignId: insertEvent.campaignId ?? null,
      projectId: null,
      status: insertEvent.status ?? "planned",
      notes: insertEvent.notes ?? null,
      createdAt: now,
      updatedAt: now
    };
    const [result] = await db.insert(vspContentCalendar).values(eventData).returning();
    return result;
  }
  async updateVspContentCalendarEvent(id, updates) {
    const [result] = await db.update(vspContentCalendar).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(vspContentCalendar.id, id)).returning();
    return result || void 0;
  }
  async deleteVspContentCalendarEvent(id) {
    const results = await db.delete(vspContentCalendar).where(eq(vspContentCalendar.id, id)).returning();
    return results.length > 0;
  }
  // ===== VSP Content Templates =====
  async getVspContentTemplates() {
    return db.select().from(vspContentTemplates).orderBy(desc(vspContentTemplates.usageCount));
  }
  async getVspContentTemplatesByCategory(category) {
    return db.select().from(vspContentTemplates).where(eq(vspContentTemplates.category, category)).orderBy(desc(vspContentTemplates.usageCount));
  }
  async createVspContentTemplate(insertTemplate) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const templateData = {
      id,
      name: insertTemplate.name,
      category: insertTemplate.category,
      subtopic: insertTemplate.subtopic,
      scriptTemplate: insertTemplate.scriptTemplate,
      captionTemplate: insertTemplate.captionTemplate ?? null,
      tags: insertTemplate.tags ?? [],
      isPublic: insertTemplate.isPublic ?? false,
      usageCount: 0,
      createdAt: now,
      updatedAt: now
    };
    const [result] = await db.insert(vspContentTemplates).values(templateData).returning();
    return result;
  }
  async updateVspContentTemplate(id, updates) {
    const [result] = await db.update(vspContentTemplates).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(vspContentTemplates.id, id)).returning();
    return result || void 0;
  }
  async deleteVspContentTemplate(id) {
    const results = await db.delete(vspContentTemplates).where(eq(vspContentTemplates.id, id)).returning();
    return results.length > 0;
  }
  // ===== VSP Campaign Templates (hardcoded static data) =====
  async getVspCampaignTemplates() {
    return [
      {
        id: "viral-trends",
        name: "Viral Trends",
        description: "Capitalize on trending topics and hashtags",
        category: "Entertainment",
        duration: 30,
        contentFrequency: 3,
        contentMix: { mainTheme: 70, related: 20, engagement: 10 },
        contentTypes: ["script", "caption"],
        schedulingPattern: {
          daysOfWeek: [1, 2, 3, 4, 5],
          times: ["09:00", "15:00", "21:00"],
          spacing: "peak-focus"
        },
        subtopics: [
          "Social Media Trends",
          "Viral Challenges",
          "Pop Culture Moments",
          "Entertainment News",
          "Celebrity Updates"
        ],
        goals: {
          targetViews: 1e5,
          targetEngagement: 5,
          platforms: ["TikTok", "Instagram"],
          objectives: ["Viral", "Trending"]
        },
        isPublic: true,
        usageCount: 0,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "educational-series",
        name: "Educational Series",
        description: "Build authority with educational content",
        category: "Business",
        duration: 60,
        contentFrequency: 1,
        contentMix: { mainTheme: 80, related: 15, engagement: 5 },
        contentTypes: ["script", "caption"],
        schedulingPattern: {
          daysOfWeek: [1, 3, 5],
          times: ["10:00", "16:00"],
          spacing: "even"
        },
        subtopics: [
          "Personal Growth & Development",
          "Self-Improvement Tips",
          "Mindset & Psychology",
          "Life Skills & Learning",
          "Success Habits"
        ],
        goals: {
          targetViews: 5e4,
          targetEngagement: 8,
          platforms: ["YouTube", "TikTok"],
          objectives: ["Educational", "Authority"]
        },
        isPublic: true,
        usageCount: 0,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }
    ];
  }
  async getVspCampaignTemplate(id) {
    const templates = await this.getVspCampaignTemplates();
    return templates.find((t) => t.id === id);
  }
  // ===== VSP Bulk Generation Jobs =====
  async createVspBulkGenerationJob(job) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const jobData = {
      id,
      campaignId: job.campaignId,
      templateId: job.templateId || null,
      status: job.status ?? "pending",
      totalItems: job.totalItems,
      completedItems: 0,
      failedItems: 0,
      generationType: job.generationType,
      scheduledDates: job.scheduledDates ?? null,
      progress: null,
      errors: null,
      createdAt: now,
      updatedAt: now
    };
    const [result] = await db.insert(vspBulkGenerationJobs).values(jobData).returning();
    return result;
  }
  async getVspBulkGenerationJob(id) {
    const [job] = await db.select().from(vspBulkGenerationJobs).where(eq(vspBulkGenerationJobs.id, id));
    return job || void 0;
  }
  async updateVspBulkGenerationJob(id, updates) {
    const [result] = await db.update(vspBulkGenerationJobs).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(vspBulkGenerationJobs.id, id)).returning();
    return result || void 0;
  }
  // ===== VSP Content Categories =====
  async getVspContentCategories() {
    return db.select().from(vspContentCategories).orderBy(vspContentCategories.sortOrder, vspContentCategories.name);
  }
  async getVspContentCategory(id) {
    const [category] = await db.select().from(vspContentCategories).where(eq(vspContentCategories.id, id));
    return category;
  }
  async createVspContentCategory(category) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const categoryData = {
      id,
      ...category,
      createdAt: now,
      updatedAt: now
    };
    const [result] = await db.insert(vspContentCategories).values(categoryData).returning();
    return result;
  }
  async updateVspContentCategory(id, updates) {
    const [result] = await db.update(vspContentCategories).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(vspContentCategories.id, id)).returning();
    return result;
  }
  async deleteVspContentCategory(id) {
    const results = await db.delete(vspContentCategories).where(eq(vspContentCategories.id, id)).returning();
    return results.length > 0;
  }
  // ===== VSP Content Subtopics =====
  async getVspContentSubtopics(categoryId) {
    if (categoryId) {
      return db.select().from(vspContentSubtopics).where(eq(vspContentSubtopics.categoryId, categoryId)).orderBy(vspContentSubtopics.sortOrder, vspContentSubtopics.name);
    }
    return db.select().from(vspContentSubtopics).orderBy(vspContentSubtopics.sortOrder, vspContentSubtopics.name);
  }
  async getVspContentSubtopic(id) {
    const [subtopic] = await db.select().from(vspContentSubtopics).where(eq(vspContentSubtopics.id, id));
    return subtopic;
  }
  async createVspContentSubtopic(subtopic) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const subtopicData = {
      id,
      ...subtopic,
      createdAt: now,
      updatedAt: now
    };
    const [result] = await db.insert(vspContentSubtopics).values(subtopicData).returning();
    return result;
  }
  async updateVspContentSubtopic(id, updates) {
    const [result] = await db.update(vspContentSubtopics).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(vspContentSubtopics.id, id)).returning();
    return result;
  }
  async deleteVspContentSubtopic(id) {
    const results = await db.delete(vspContentSubtopics).where(eq(vspContentSubtopics.id, id)).returning();
    return results.length > 0;
  }
  // ===== VSP Script Styles =====
  async getVspScriptStyles() {
    return db.select().from(vspScriptStyles).where(eq(vspScriptStyles.isActive, true)).orderBy(vspScriptStyles.sortOrder, vspScriptStyles.name);
  }
  async getVspScriptStyle(id) {
    const [style] = await db.select().from(vspScriptStyles).where(eq(vspScriptStyles.id, id));
    return style;
  }
  async createVspScriptStyle(style) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const styleData = {
      id,
      ...style,
      createdAt: now,
      updatedAt: now
    };
    const [result] = await db.insert(vspScriptStyles).values(styleData).returning();
    return result;
  }
  async updateVspScriptStyle(id, updates) {
    const [result] = await db.update(vspScriptStyles).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(vspScriptStyles.id, id)).returning();
    return result;
  }
  async deleteVspScriptStyle(id) {
    const results = await db.delete(vspScriptStyles).where(eq(vspScriptStyles.id, id)).returning();
    return results.length > 0;
  }
  // ===== VSP Caption Styles =====
  async getVspCaptionStyles() {
    return db.select().from(vspCaptionStyles).where(eq(vspCaptionStyles.isActive, true)).orderBy(vspCaptionStyles.sortOrder, vspCaptionStyles.name);
  }
  async getVspCaptionStyle(id) {
    const [style] = await db.select().from(vspCaptionStyles).where(eq(vspCaptionStyles.id, id));
    return style;
  }
  async createVspCaptionStyle(style) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const styleData = {
      id,
      ...style,
      createdAt: now,
      updatedAt: now
    };
    const [result] = await db.insert(vspCaptionStyles).values(styleData).returning();
    return result;
  }
  async updateVspCaptionStyle(id, updates) {
    const [result] = await db.update(vspCaptionStyles).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(vspCaptionStyles.id, id)).returning();
    return result;
  }
  async deleteVspCaptionStyle(id) {
    const results = await db.delete(vspCaptionStyles).where(eq(vspCaptionStyles.id, id)).returning();
    return results.length > 0;
  }
  // ===== CI Competitors =====
  async getCiCompetitors(activeOnly) {
    if (activeOnly) {
      return db.select().from(ciCompetitors).where(eq(ciCompetitors.isActive, true)).orderBy(asc(ciCompetitors.handle));
    }
    return db.select().from(ciCompetitors).orderBy(asc(ciCompetitors.handle));
  }
  async getCiCompetitor(id) {
    const [result] = await db.select().from(ciCompetitors).where(eq(ciCompetitors.id, id));
    return result;
  }
  async createCiCompetitor(data) {
    const [result] = await db.insert(ciCompetitors).values(data).returning();
    return result;
  }
  async updateCiCompetitor(id, data) {
    const [result] = await db.update(ciCompetitors).set(data).where(eq(ciCompetitors.id, id)).returning();
    return result;
  }
  async deleteCiCompetitor(id) {
    const results = await db.delete(ciCompetitors).where(eq(ciCompetitors.id, id)).returning();
    return results.length > 0;
  }
  // ===== CI Scraped Videos =====
  async getCiScrapedVideos(filters) {
    const all = await db.select().from(ciScrapedVideos).orderBy(desc(ciScrapedVideos.createdAt));
    if (!filters) return all;
    return all.filter((v) => {
      if (filters.competitorId && v.competitorId !== filters.competitorId) return false;
      if (filters.transcriptStatus && v.transcriptStatus !== filters.transcriptStatus) return false;
      if (filters.analysisStatus && v.analysisStatus !== filters.analysisStatus) return false;
      if (filters.minViews && (v.viewCount || 0) < filters.minViews) return false;
      return true;
    });
  }
  async getCiScrapedVideo(id) {
    const [result] = await db.select().from(ciScrapedVideos).where(eq(ciScrapedVideos.id, id));
    return result;
  }
  async getCiScrapedVideoByExternalId(externalVideoId) {
    const [result] = await db.select().from(ciScrapedVideos).where(eq(ciScrapedVideos.externalVideoId, externalVideoId));
    return result;
  }
  async createCiScrapedVideo(data) {
    const [result] = await db.insert(ciScrapedVideos).values(data).returning();
    return result;
  }
  async updateCiScrapedVideo(id, data) {
    const [result] = await db.update(ciScrapedVideos).set(data).where(eq(ciScrapedVideos.id, id)).returning();
    return result;
  }
  // ===== CI Video Analyses =====
  async getCiVideoAnalyses(filters) {
    const conditions = [];
    if (filters?.hookType) conditions.push(eq(ciVideoAnalyses.hookType, filters.hookType));
    if (filters?.topicCategory) conditions.push(eq(ciVideoAnalyses.topicCategory, filters.topicCategory));
    if (filters?.minReplicationScore) conditions.push(gte(ciVideoAnalyses.replicationScore, filters.minReplicationScore));
    if (filters?.weekAdded) conditions.push(eq(ciVideoAnalyses.weekAdded, filters.weekAdded));
    const query = db.select().from(ciVideoAnalyses).orderBy(desc(ciVideoAnalyses.createdAt));
    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  }
  async getCiVideoAnalysesEnriched(filters) {
    const conditions = [];
    if (filters?.hookType) conditions.push(eq(ciVideoAnalyses.hookType, filters.hookType));
    if (filters?.topicCategory) conditions.push(eq(ciVideoAnalyses.topicCategory, filters.topicCategory));
    if (filters?.minReplicationScore) conditions.push(gte(ciVideoAnalyses.replicationScore, filters.minReplicationScore));
    if (filters?.weekAdded) conditions.push(eq(ciVideoAnalyses.weekAdded, filters.weekAdded));
    const query = db.select({
      id: ciVideoAnalyses.id,
      scrapedVideoId: ciVideoAnalyses.scrapedVideoId,
      blocked: ciVideoAnalyses.blocked,
      blockReason: ciVideoAnalyses.blockReason,
      topicCategory: ciVideoAnalyses.topicCategory,
      topicSummary: ciVideoAnalyses.topicSummary,
      hookText: ciVideoAnalyses.hookText,
      hookType: ciVideoAnalyses.hookType,
      hookSummary: ciVideoAnalyses.hookSummary,
      emotionalAngle: ciVideoAnalyses.emotionalAngle,
      targetAudience: ciVideoAnalyses.targetAudience,
      format: ciVideoAnalyses.format,
      ctaType: ciVideoAnalyses.ctaType,
      replicationScore: ciVideoAnalyses.replicationScore,
      notes: ciVideoAnalyses.notes,
      rawAnalysis: ciVideoAnalyses.rawAnalysis,
      weekAdded: ciVideoAnalyses.weekAdded,
      createdAt: ciVideoAnalyses.createdAt,
      // Video fields (no transcript)
      videoUrl: ciScrapedVideos.url,
      viewCount: ciScrapedVideos.viewCount,
      likeCount: ciScrapedVideos.likeCount,
      commentCount: ciScrapedVideos.commentCount,
      shareCount: ciScrapedVideos.shareCount,
      postedAt: ciScrapedVideos.postedAt,
      transcriptPreview: sql`CASE WHEN length(${ciScrapedVideos.transcript}) > 200 THEN substring(${ciScrapedVideos.transcript} from 1 for 200) || '...' ELSE ${ciScrapedVideos.transcript} END`.as("transcript_preview"),
      // Competitor fields
      competitorHandle: ciCompetitors.handle,
      competitorPlatform: ciCompetitors.platform
    }).from(ciVideoAnalyses).leftJoin(ciScrapedVideos, eq(ciVideoAnalyses.scrapedVideoId, ciScrapedVideos.id)).leftJoin(ciCompetitors, eq(ciScrapedVideos.competitorId, ciCompetitors.id)).orderBy(desc(ciVideoAnalyses.createdAt));
    const rows = conditions.length > 0 ? await query.where(and(...conditions)) : await query;
    return rows.map((r) => ({
      ...r,
      creator: r.competitorHandle || "unknown",
      platform: r.competitorPlatform || "tiktok",
      views: r.viewCount ?? 0,
      videoUrl: r.videoUrl || null,
      likes: r.likeCount ?? 0,
      shares: r.shareCount ?? 0,
      comments: r.commentCount ?? 0,
      postedAt: r.postedAt || null,
      transcriptPreview: r.transcriptPreview || null,
      transcript: null
      // Don't send full transcripts in list view
    }));
  }
  async getCiVideoAnalysis(id) {
    const [result] = await db.select().from(ciVideoAnalyses).where(eq(ciVideoAnalyses.id, id));
    return result;
  }
  async getCiVideoAnalysisByVideoId(scrapedVideoId) {
    const [result] = await db.select().from(ciVideoAnalyses).where(eq(ciVideoAnalyses.scrapedVideoId, scrapedVideoId));
    return result;
  }
  async createCiVideoAnalysis(data) {
    const [result] = await db.insert(ciVideoAnalyses).values(data).returning();
    return result;
  }
  async deleteCiVideoAnalysis(id) {
    await db.delete(ciVideoAnalyses).where(eq(ciVideoAnalyses.id, id));
    return true;
  }
  async deleteCiScrapedVideo(id) {
    await db.delete(ciScrapedVideos).where(eq(ciScrapedVideos.id, id));
    return true;
  }
  async getCiAnalysesPendingBrief() {
    const rows = await db.select({
      id: ciVideoAnalyses.id,
      scrapedVideoId: ciVideoAnalyses.scrapedVideoId,
      blocked: ciVideoAnalyses.blocked,
      blockReason: ciVideoAnalyses.blockReason,
      topicCategory: ciVideoAnalyses.topicCategory,
      topicSummary: ciVideoAnalyses.topicSummary,
      hookText: ciVideoAnalyses.hookText,
      hookType: ciVideoAnalyses.hookType,
      hookSummary: ciVideoAnalyses.hookSummary,
      emotionalAngle: ciVideoAnalyses.emotionalAngle,
      targetAudience: ciVideoAnalyses.targetAudience,
      format: ciVideoAnalyses.format,
      ctaType: ciVideoAnalyses.ctaType,
      replicationScore: ciVideoAnalyses.replicationScore,
      notes: ciVideoAnalyses.notes,
      rawAnalysis: ciVideoAnalyses.rawAnalysis,
      weekAdded: ciVideoAnalyses.weekAdded,
      createdAt: ciVideoAnalyses.createdAt,
      videoBriefStatus: ciScrapedVideos.briefStatus,
      videoViewCount: ciScrapedVideos.viewCount,
      videoLikeCount: ciScrapedVideos.likeCount,
      videoCommentCount: ciScrapedVideos.commentCount,
      videoShareCount: ciScrapedVideos.shareCount,
      videoPostedAt: ciScrapedVideos.postedAt
    }).from(ciVideoAnalyses).leftJoin(ciScrapedVideos, eq(ciVideoAnalyses.scrapedVideoId, ciScrapedVideos.id)).where(
      and(
        eq(ciVideoAnalyses.blocked, false),
        sql`${ciVideoAnalyses.topicCategory} IS NOT NULL`,
        eq(ciScrapedVideos.briefStatus, "pending")
      )
    ).orderBy(desc(ciVideoAnalyses.createdAt));
    return rows.map((r) => ({
      ...r,
      videoBriefStatus: r.videoBriefStatus ?? "pending",
      videoViewCount: r.videoViewCount ?? 0,
      videoLikeCount: r.videoLikeCount ?? 0,
      videoCommentCount: r.videoCommentCount ?? 0,
      videoShareCount: r.videoShareCount ?? 0,
      videoPostedAt: r.videoPostedAt ?? null
    }));
  }
  async markVideoAsBriefed(videoId) {
    await db.update(ciScrapedVideos).set({ briefStatus: "briefed" }).where(eq(ciScrapedVideos.id, videoId));
  }
  // ===== CI Content Briefs =====
  async getCiContentBriefs(status) {
    const all = await db.select().from(ciContentBriefs).orderBy(desc(ciContentBriefs.createdAt));
    if (status) return all.filter((b) => b.status === status);
    return all;
  }
  async getCiContentBrief(id) {
    const [result] = await db.select().from(ciContentBriefs).where(eq(ciContentBriefs.id, id));
    return result;
  }
  async createCiContentBrief(data) {
    const [result] = await db.insert(ciContentBriefs).values(data).returning();
    return result;
  }
  async updateCiContentBrief(id, data) {
    const [result] = await db.update(ciContentBriefs).set(data).where(eq(ciContentBriefs.id, id)).returning();
    return result;
  }
  async deleteCiContentBrief(id) {
    await db.delete(ciContentBriefs).where(eq(ciContentBriefs.id, id));
    return true;
  }
  // ===== CI Brief Scripts =====
  async getCiBriefScripts(briefId) {
    if (briefId) {
      return db.select().from(ciBriefScripts).where(eq(ciBriefScripts.briefId, briefId)).orderBy(desc(ciBriefScripts.createdAt));
    }
    return db.select().from(ciBriefScripts).orderBy(desc(ciBriefScripts.createdAt));
  }
  async getCiBriefScript(id) {
    const [result] = await db.select().from(ciBriefScripts).where(eq(ciBriefScripts.id, id));
    return result;
  }
  async createCiBriefScript(data) {
    const [result] = await db.insert(ciBriefScripts).values(data).returning();
    return result;
  }
  async updateCiBriefScript(id, data) {
    const [result] = await db.update(ciBriefScripts).set(data).where(eq(ciBriefScripts.id, id)).returning();
    return result;
  }
  async deleteCiBriefScript(id) {
    await db.delete(ciBriefScripts).where(eq(ciBriefScripts.id, id));
    return true;
  }
  // ===== CI Performance Reports =====
  async getCiPerformanceReports() {
    return db.select().from(ciPerformanceReports).orderBy(desc(ciPerformanceReports.createdAt));
  }
  async getCiPerformanceReport(id) {
    const [result] = await db.select().from(ciPerformanceReports).where(eq(ciPerformanceReports.id, id));
    return result;
  }
  async createCiPerformanceReport(data) {
    const [result] = await db.insert(ciPerformanceReports).values(data).returning();
    return result;
  }
  // ===== CI Settings =====
  async getCiSettings(category) {
    if (category) {
      return db.select().from(ciSettings).where(eq(ciSettings.category, category));
    }
    return db.select().from(ciSettings);
  }
  async getCiSetting(key) {
    const [result] = await db.select().from(ciSettings).where(eq(ciSettings.key, key));
    return result;
  }
  async upsertCiSetting(key, value, meta) {
    const existing = await this.getCiSetting(key);
    if (existing) {
      const [result2] = await db.update(ciSettings).set({
        value,
        ...meta,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }).where(eq(ciSettings.key, key)).returning();
      return result2;
    }
    const [result] = await db.insert(ciSettings).values({
      key,
      value,
      category: meta?.category ?? "general",
      label: meta?.label,
      description: meta?.description,
      valueType: meta?.valueType ?? "text"
    }).returning();
    return result;
  }
  // ============ SOCIAL POSTS ============
  async getSocialPosts() {
    const results = await db.select().from(socialPosts).orderBy(desc(socialPosts.updatedAt));
    return results;
  }
  async getSocialPost(id) {
    const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, id));
    if (!post) return void 0;
    return post;
  }
  async createSocialPost(post) {
    const id = randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const [result] = await db.insert(socialPosts).values({ ...post, id, createdAt: now, updatedAt: now }).returning();
    return result;
  }
  async updateSocialPost(id, updates) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const [result] = await db.update(socialPosts).set({ ...updates, updatedAt: now }).where(eq(socialPosts.id, id)).returning();
    if (!result) return void 0;
    return result;
  }
  async deleteSocialPost(id) {
    const results = await db.delete(socialPosts).where(eq(socialPosts.id, id)).returning();
    return results.length > 0;
  }
  // ============ SOCIAL POST SLIDES ============
  async getSocialPostSlides(postId) {
    const results = await db.select().from(socialPostSlides).where(eq(socialPostSlides.postId, postId)).orderBy(asc(socialPostSlides.slideOrder));
    return results;
  }
  async createSocialPostSlide(slide) {
    const id = randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const [result] = await db.insert(socialPostSlides).values({ ...slide, id, createdAt: now }).returning();
    return result;
  }
  async updateSocialPostSlide(id, updates) {
    const [result] = await db.update(socialPostSlides).set(updates).where(eq(socialPostSlides.id, id)).returning();
    if (!result) return void 0;
    return result;
  }
  async deleteSocialPostSlide(id) {
    const results = await db.delete(socialPostSlides).where(eq(socialPostSlides.id, id)).returning();
    return results.length > 0;
  }
  async deleteSocialPostSlidesByPostId(postId) {
    const results = await db.delete(socialPostSlides).where(eq(socialPostSlides.postId, postId)).returning();
    return results.length >= 0;
  }
  // ============ SOCIAL CAROUSEL TYPES ============
  async getSocialCarouselTypes() {
    const results = await db.select().from(socialCarouselTypes).orderBy(asc(socialCarouselTypes.sortOrder));
    return results;
  }
  async getSocialCarouselType(id) {
    const [result] = await db.select().from(socialCarouselTypes).where(eq(socialCarouselTypes.id, id));
    if (!result) return void 0;
    return result;
  }
  async createSocialCarouselType(type) {
    const id = randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const [result] = await db.insert(socialCarouselTypes).values({ ...type, id, createdAt: now }).returning();
    return result;
  }
  async updateSocialCarouselType(id, updates) {
    const [result] = await db.update(socialCarouselTypes).set(updates).where(eq(socialCarouselTypes.id, id)).returning();
    if (!result) return void 0;
    return result;
  }
  async deleteSocialCarouselType(id) {
    const results = await db.delete(socialCarouselTypes).where(eq(socialCarouselTypes.id, id)).returning();
    return results.length > 0;
  }
  // ============ SOCIAL TEMPLATE SETS ============
  async getSocialTemplateSets() {
    const results = await db.select().from(socialTemplateSets).orderBy(desc(socialTemplateSets.createdAt));
    return results;
  }
  async getSocialTemplateSet(id) {
    const [result] = await db.select().from(socialTemplateSets).where(eq(socialTemplateSets.id, id));
    if (!result) return void 0;
    return result;
  }
  async createSocialTemplateSet(set) {
    const id = randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const [result] = await db.insert(socialTemplateSets).values({ ...set, id, createdAt: now }).returning();
    return result;
  }
  async updateSocialTemplateSet(id, updates) {
    const [result] = await db.update(socialTemplateSets).set(updates).where(eq(socialTemplateSets.id, id)).returning();
    if (!result) return void 0;
    return result;
  }
  async deleteSocialTemplateSet(id) {
    const results = await db.delete(socialTemplateSets).where(eq(socialTemplateSets.id, id)).returning();
    return results.length > 0;
  }
  // ============ SOCIAL SLIDE TEMPLATES ============
  async getSocialSlideTemplates(setName) {
    if (setName) {
      const results2 = await db.select().from(socialSlideTemplates).where(eq(socialSlideTemplates.setName, setName)).orderBy(asc(socialSlideTemplates.type));
      return results2;
    }
    const results = await db.select().from(socialSlideTemplates).orderBy(asc(socialSlideTemplates.type));
    return results;
  }
  async getSocialSlideTemplate(id) {
    const [result] = await db.select().from(socialSlideTemplates).where(eq(socialSlideTemplates.id, id));
    if (!result) return void 0;
    return result;
  }
  async createSocialSlideTemplate(template) {
    const id = randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const [result] = await db.insert(socialSlideTemplates).values({ ...template, id, createdAt: now }).returning();
    return result;
  }
  async updateSocialSlideTemplate(id, updates) {
    const [result] = await db.update(socialSlideTemplates).set(updates).where(eq(socialSlideTemplates.id, id)).returning();
    if (!result) return void 0;
    return result;
  }
  async deleteSocialSlideTemplate(id) {
    const results = await db.delete(socialSlideTemplates).where(eq(socialSlideTemplates.id, id)).returning();
    return results.length > 0;
  }
  // ============ SOCIAL MEDIA LIBRARY ============
  async getSocialMediaLibrary(tag) {
    const results = await db.select().from(socialMediaLibrary).orderBy(desc(socialMediaLibrary.createdAt));
    if (tag) {
      return results.filter((item) => {
        const tags = item.tags;
        return tags && tags.includes(tag);
      });
    }
    return results;
  }
  async createSocialMediaLibraryItem(item) {
    const id = randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const [result] = await db.insert(socialMediaLibrary).values({ ...item, id, createdAt: now }).returning();
    return result;
  }
  async deleteSocialMediaLibraryItem(id) {
    const results = await db.delete(socialMediaLibrary).where(eq(socialMediaLibrary.id, id)).returning();
    return results.length > 0;
  }
};
var storage = new DatabaseStorage();

// node_modules/openai/internal/tslib.mjs
function __classPrivateFieldSet(receiver, state, value, kind, f) {
  if (kind === "m")
    throw new TypeError("Private method is not writable");
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
}
function __classPrivateFieldGet(receiver, state, kind, f) {
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

// node_modules/openai/internal/utils/uuid.mjs
var uuid4 = function() {
  const { crypto: crypto2 } = globalThis;
  if (crypto2?.randomUUID) {
    uuid4 = crypto2.randomUUID.bind(crypto2);
    return crypto2.randomUUID();
  }
  const u8 = new Uint8Array(1);
  const randomByte = crypto2 ? () => crypto2.getRandomValues(u8)[0] : () => Math.random() * 255 & 255;
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (+c ^ randomByte() & 15 >> +c / 4).toString(16));
};

// node_modules/openai/internal/errors.mjs
function isAbortError(err) {
  return typeof err === "object" && err !== null && // Spec-compliant fetch implementations
  ("name" in err && err.name === "AbortError" || // Expo fetch
  "message" in err && String(err.message).includes("FetchRequestCanceledException"));
}
var castToError = (err) => {
  if (err instanceof Error)
    return err;
  if (typeof err === "object" && err !== null) {
    try {
      if (Object.prototype.toString.call(err) === "[object Error]") {
        const error = new Error(err.message, err.cause ? { cause: err.cause } : {});
        if (err.stack)
          error.stack = err.stack;
        if (err.cause && !error.cause)
          error.cause = err.cause;
        if (err.name)
          error.name = err.name;
        return error;
      }
    } catch {
    }
    try {
      return new Error(JSON.stringify(err));
    } catch {
    }
  }
  return new Error(err);
};

// node_modules/openai/core/error.mjs
var OpenAIError = class extends Error {
};
var APIError = class _APIError extends OpenAIError {
  constructor(status, error, message, headers) {
    super(`${_APIError.makeMessage(status, error, message)}`);
    this.status = status;
    this.headers = headers;
    this.requestID = headers?.get("x-request-id");
    this.error = error;
    const data = error;
    this.code = data?.["code"];
    this.param = data?.["param"];
    this.type = data?.["type"];
  }
  static makeMessage(status, error, message) {
    const msg = error?.message ? typeof error.message === "string" ? error.message : JSON.stringify(error.message) : error ? JSON.stringify(error) : message;
    if (status && msg) {
      return `${status} ${msg}`;
    }
    if (status) {
      return `${status} status code (no body)`;
    }
    if (msg) {
      return msg;
    }
    return "(no status code or body)";
  }
  static generate(status, errorResponse, message, headers) {
    if (!status || !headers) {
      return new APIConnectionError({ message, cause: castToError(errorResponse) });
    }
    const error = errorResponse?.["error"];
    if (status === 400) {
      return new BadRequestError(status, error, message, headers);
    }
    if (status === 401) {
      return new AuthenticationError(status, error, message, headers);
    }
    if (status === 403) {
      return new PermissionDeniedError(status, error, message, headers);
    }
    if (status === 404) {
      return new NotFoundError(status, error, message, headers);
    }
    if (status === 409) {
      return new ConflictError(status, error, message, headers);
    }
    if (status === 422) {
      return new UnprocessableEntityError(status, error, message, headers);
    }
    if (status === 429) {
      return new RateLimitError(status, error, message, headers);
    }
    if (status >= 500) {
      return new InternalServerError(status, error, message, headers);
    }
    return new _APIError(status, error, message, headers);
  }
};
var APIUserAbortError = class extends APIError {
  constructor({ message } = {}) {
    super(void 0, void 0, message || "Request was aborted.", void 0);
  }
};
var APIConnectionError = class extends APIError {
  constructor({ message, cause }) {
    super(void 0, void 0, message || "Connection error.", void 0);
    if (cause)
      this.cause = cause;
  }
};
var APIConnectionTimeoutError = class extends APIConnectionError {
  constructor({ message } = {}) {
    super({ message: message ?? "Request timed out." });
  }
};
var BadRequestError = class extends APIError {
};
var AuthenticationError = class extends APIError {
};
var PermissionDeniedError = class extends APIError {
};
var NotFoundError = class extends APIError {
};
var ConflictError = class extends APIError {
};
var UnprocessableEntityError = class extends APIError {
};
var RateLimitError = class extends APIError {
};
var InternalServerError = class extends APIError {
};
var LengthFinishReasonError = class extends OpenAIError {
  constructor() {
    super(`Could not parse response content as the length limit was reached`);
  }
};
var ContentFilterFinishReasonError = class extends OpenAIError {
  constructor() {
    super(`Could not parse response content as the request was rejected by the content filter`);
  }
};
var InvalidWebhookSignatureError = class extends Error {
  constructor(message) {
    super(message);
  }
};

// node_modules/openai/internal/utils/values.mjs
var startsWithSchemeRegexp = /^[a-z][a-z0-9+.-]*:/i;
var isAbsoluteURL = (url) => {
  return startsWithSchemeRegexp.test(url);
};
var isArray = (val) => (isArray = Array.isArray, isArray(val));
var isReadonlyArray = isArray;
function maybeObj(x) {
  if (typeof x !== "object") {
    return {};
  }
  return x ?? {};
}
function isEmptyObj(obj) {
  if (!obj)
    return true;
  for (const _k in obj)
    return false;
  return true;
}
function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
function isObj(obj) {
  return obj != null && typeof obj === "object" && !Array.isArray(obj);
}
var validatePositiveInteger = (name, n) => {
  if (typeof n !== "number" || !Number.isInteger(n)) {
    throw new OpenAIError(`${name} must be an integer`);
  }
  if (n < 0) {
    throw new OpenAIError(`${name} must be a positive integer`);
  }
  return n;
};
var safeJSON = (text2) => {
  try {
    return JSON.parse(text2);
  } catch (err) {
    return void 0;
  }
};

// node_modules/openai/internal/utils/sleep.mjs
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// node_modules/openai/version.mjs
var VERSION = "6.15.0";

// node_modules/openai/internal/detect-platform.mjs
var isRunningInBrowser = () => {
  return (
    // @ts-ignore
    typeof window !== "undefined" && // @ts-ignore
    typeof window.document !== "undefined" && // @ts-ignore
    typeof navigator !== "undefined"
  );
};
function getDetectedPlatform() {
  if (typeof Deno !== "undefined" && Deno.build != null) {
    return "deno";
  }
  if (typeof EdgeRuntime !== "undefined") {
    return "edge";
  }
  if (Object.prototype.toString.call(typeof globalThis.process !== "undefined" ? globalThis.process : 0) === "[object process]") {
    return "node";
  }
  return "unknown";
}
var getPlatformProperties = () => {
  const detectedPlatform = getDetectedPlatform();
  if (detectedPlatform === "deno") {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": normalizePlatform(Deno.build.os),
      "X-Stainless-Arch": normalizeArch(Deno.build.arch),
      "X-Stainless-Runtime": "deno",
      "X-Stainless-Runtime-Version": typeof Deno.version === "string" ? Deno.version : Deno.version?.deno ?? "unknown"
    };
  }
  if (typeof EdgeRuntime !== "undefined") {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": "Unknown",
      "X-Stainless-Arch": `other:${EdgeRuntime}`,
      "X-Stainless-Runtime": "edge",
      "X-Stainless-Runtime-Version": globalThis.process.version
    };
  }
  if (detectedPlatform === "node") {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": normalizePlatform(globalThis.process.platform ?? "unknown"),
      "X-Stainless-Arch": normalizeArch(globalThis.process.arch ?? "unknown"),
      "X-Stainless-Runtime": "node",
      "X-Stainless-Runtime-Version": globalThis.process.version ?? "unknown"
    };
  }
  const browserInfo = getBrowserInfo();
  if (browserInfo) {
    return {
      "X-Stainless-Lang": "js",
      "X-Stainless-Package-Version": VERSION,
      "X-Stainless-OS": "Unknown",
      "X-Stainless-Arch": "unknown",
      "X-Stainless-Runtime": `browser:${browserInfo.browser}`,
      "X-Stainless-Runtime-Version": browserInfo.version
    };
  }
  return {
    "X-Stainless-Lang": "js",
    "X-Stainless-Package-Version": VERSION,
    "X-Stainless-OS": "Unknown",
    "X-Stainless-Arch": "unknown",
    "X-Stainless-Runtime": "unknown",
    "X-Stainless-Runtime-Version": "unknown"
  };
};
function getBrowserInfo() {
  if (typeof navigator === "undefined" || !navigator) {
    return null;
  }
  const browserPatterns = [
    { key: "edge", pattern: /Edge(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "ie", pattern: /MSIE(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "ie", pattern: /Trident(?:.*rv\:(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "chrome", pattern: /Chrome(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "firefox", pattern: /Firefox(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "safari", pattern: /(?:Version\W+(\d+)\.(\d+)(?:\.(\d+))?)?(?:\W+Mobile\S*)?\W+Safari/ }
  ];
  for (const { key, pattern } of browserPatterns) {
    const match = pattern.exec(navigator.userAgent);
    if (match) {
      const major = match[1] || 0;
      const minor = match[2] || 0;
      const patch = match[3] || 0;
      return { browser: key, version: `${major}.${minor}.${patch}` };
    }
  }
  return null;
}
var normalizeArch = (arch) => {
  if (arch === "x32")
    return "x32";
  if (arch === "x86_64" || arch === "x64")
    return "x64";
  if (arch === "arm")
    return "arm";
  if (arch === "aarch64" || arch === "arm64")
    return "arm64";
  if (arch)
    return `other:${arch}`;
  return "unknown";
};
var normalizePlatform = (platform) => {
  platform = platform.toLowerCase();
  if (platform.includes("ios"))
    return "iOS";
  if (platform === "android")
    return "Android";
  if (platform === "darwin")
    return "MacOS";
  if (platform === "win32")
    return "Windows";
  if (platform === "freebsd")
    return "FreeBSD";
  if (platform === "openbsd")
    return "OpenBSD";
  if (platform === "linux")
    return "Linux";
  if (platform)
    return `Other:${platform}`;
  return "Unknown";
};
var _platformHeaders;
var getPlatformHeaders = () => {
  return _platformHeaders ?? (_platformHeaders = getPlatformProperties());
};

// node_modules/openai/internal/shims.mjs
function getDefaultFetch() {
  if (typeof fetch !== "undefined") {
    return fetch;
  }
  throw new Error("`fetch` is not defined as a global; Either pass `fetch` to the client, `new OpenAI({ fetch })` or polyfill the global, `globalThis.fetch = fetch`");
}
function makeReadableStream(...args) {
  const ReadableStream = globalThis.ReadableStream;
  if (typeof ReadableStream === "undefined") {
    throw new Error("`ReadableStream` is not defined as a global; You will need to polyfill it, `globalThis.ReadableStream = ReadableStream`");
  }
  return new ReadableStream(...args);
}
function ReadableStreamFrom(iterable) {
  let iter = Symbol.asyncIterator in iterable ? iterable[Symbol.asyncIterator]() : iterable[Symbol.iterator]();
  return makeReadableStream({
    start() {
    },
    async pull(controller) {
      const { done, value } = await iter.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
    async cancel() {
      await iter.return?.();
    }
  });
}
function ReadableStreamToAsyncIterable(stream) {
  if (stream[Symbol.asyncIterator])
    return stream;
  const reader = stream.getReader();
  return {
    async next() {
      try {
        const result = await reader.read();
        if (result?.done)
          reader.releaseLock();
        return result;
      } catch (e) {
        reader.releaseLock();
        throw e;
      }
    },
    async return() {
      const cancelPromise = reader.cancel();
      reader.releaseLock();
      await cancelPromise;
      return { done: true, value: void 0 };
    },
    [Symbol.asyncIterator]() {
      return this;
    }
  };
}
async function CancelReadableStream(stream) {
  if (stream === null || typeof stream !== "object")
    return;
  if (stream[Symbol.asyncIterator]) {
    await stream[Symbol.asyncIterator]().return?.();
    return;
  }
  const reader = stream.getReader();
  const cancelPromise = reader.cancel();
  reader.releaseLock();
  await cancelPromise;
}

// node_modules/openai/internal/request-options.mjs
var FallbackEncoder = ({ headers, body }) => {
  return {
    bodyHeaders: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  };
};

// node_modules/openai/internal/qs/formats.mjs
var default_format = "RFC3986";
var default_formatter = (v) => String(v);
var formatters = {
  RFC1738: (v) => String(v).replace(/%20/g, "+"),
  RFC3986: default_formatter
};
var RFC1738 = "RFC1738";

// node_modules/openai/internal/qs/utils.mjs
var has = (obj, key) => (has = Object.hasOwn ?? Function.prototype.call.bind(Object.prototype.hasOwnProperty), has(obj, key));
var hex_table = /* @__PURE__ */ (() => {
  const array = [];
  for (let i = 0; i < 256; ++i) {
    array.push("%" + ((i < 16 ? "0" : "") + i.toString(16)).toUpperCase());
  }
  return array;
})();
var limit = 1024;
var encode = (str2, _defaultEncoder, charset, _kind, format) => {
  if (str2.length === 0) {
    return str2;
  }
  let string = str2;
  if (typeof str2 === "symbol") {
    string = Symbol.prototype.toString.call(str2);
  } else if (typeof str2 !== "string") {
    string = String(str2);
  }
  if (charset === "iso-8859-1") {
    return escape(string).replace(/%u[0-9a-f]{4}/gi, function($0) {
      return "%26%23" + parseInt($0.slice(2), 16) + "%3B";
    });
  }
  let out = "";
  for (let j = 0; j < string.length; j += limit) {
    const segment = string.length >= limit ? string.slice(j, j + limit) : string;
    const arr = [];
    for (let i = 0; i < segment.length; ++i) {
      let c = segment.charCodeAt(i);
      if (c === 45 || // -
      c === 46 || // .
      c === 95 || // _
      c === 126 || // ~
      c >= 48 && c <= 57 || // 0-9
      c >= 65 && c <= 90 || // a-z
      c >= 97 && c <= 122 || // A-Z
      format === RFC1738 && (c === 40 || c === 41)) {
        arr[arr.length] = segment.charAt(i);
        continue;
      }
      if (c < 128) {
        arr[arr.length] = hex_table[c];
        continue;
      }
      if (c < 2048) {
        arr[arr.length] = hex_table[192 | c >> 6] + hex_table[128 | c & 63];
        continue;
      }
      if (c < 55296 || c >= 57344) {
        arr[arr.length] = hex_table[224 | c >> 12] + hex_table[128 | c >> 6 & 63] + hex_table[128 | c & 63];
        continue;
      }
      i += 1;
      c = 65536 + ((c & 1023) << 10 | segment.charCodeAt(i) & 1023);
      arr[arr.length] = hex_table[240 | c >> 18] + hex_table[128 | c >> 12 & 63] + hex_table[128 | c >> 6 & 63] + hex_table[128 | c & 63];
    }
    out += arr.join("");
  }
  return out;
};
function is_buffer(obj) {
  if (!obj || typeof obj !== "object") {
    return false;
  }
  return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
}
function maybe_map(val, fn) {
  if (isArray(val)) {
    const mapped = [];
    for (let i = 0; i < val.length; i += 1) {
      mapped.push(fn(val[i]));
    }
    return mapped;
  }
  return fn(val);
}

// node_modules/openai/internal/qs/stringify.mjs
var array_prefix_generators = {
  brackets(prefix) {
    return String(prefix) + "[]";
  },
  comma: "comma",
  indices(prefix, key) {
    return String(prefix) + "[" + key + "]";
  },
  repeat(prefix) {
    return String(prefix);
  }
};
var push_to_array = function(arr, value_or_array) {
  Array.prototype.push.apply(arr, isArray(value_or_array) ? value_or_array : [value_or_array]);
};
var toISOString;
var defaults2 = {
  addQueryPrefix: false,
  allowDots: false,
  allowEmptyArrays: false,
  arrayFormat: "indices",
  charset: "utf-8",
  charsetSentinel: false,
  delimiter: "&",
  encode: true,
  encodeDotInKeys: false,
  encoder: encode,
  encodeValuesOnly: false,
  format: default_format,
  formatter: default_formatter,
  /** @deprecated */
  indices: false,
  serializeDate(date2) {
    return (toISOString ?? (toISOString = Function.prototype.call.bind(Date.prototype.toISOString)))(date2);
  },
  skipNulls: false,
  strictNullHandling: false
};
function is_non_nullish_primitive(v) {
  return typeof v === "string" || typeof v === "number" || typeof v === "boolean" || typeof v === "symbol" || typeof v === "bigint";
}
var sentinel = {};
function inner_stringify(object, prefix, generateArrayPrefix, commaRoundTrip, allowEmptyArrays, strictNullHandling, skipNulls, encodeDotInKeys, encoder, filter, sort, allowDots, serializeDate, format, formatter, encodeValuesOnly, charset, sideChannel) {
  let obj = object;
  let tmp_sc = sideChannel;
  let step = 0;
  let find_flag = false;
  while ((tmp_sc = tmp_sc.get(sentinel)) !== void 0 && !find_flag) {
    const pos = tmp_sc.get(object);
    step += 1;
    if (typeof pos !== "undefined") {
      if (pos === step) {
        throw new RangeError("Cyclic object value");
      } else {
        find_flag = true;
      }
    }
    if (typeof tmp_sc.get(sentinel) === "undefined") {
      step = 0;
    }
  }
  if (typeof filter === "function") {
    obj = filter(prefix, obj);
  } else if (obj instanceof Date) {
    obj = serializeDate?.(obj);
  } else if (generateArrayPrefix === "comma" && isArray(obj)) {
    obj = maybe_map(obj, function(value) {
      if (value instanceof Date) {
        return serializeDate?.(value);
      }
      return value;
    });
  }
  if (obj === null) {
    if (strictNullHandling) {
      return encoder && !encodeValuesOnly ? (
        // @ts-expect-error
        encoder(prefix, defaults2.encoder, charset, "key", format)
      ) : prefix;
    }
    obj = "";
  }
  if (is_non_nullish_primitive(obj) || is_buffer(obj)) {
    if (encoder) {
      const key_value = encodeValuesOnly ? prefix : encoder(prefix, defaults2.encoder, charset, "key", format);
      return [
        formatter?.(key_value) + "=" + // @ts-expect-error
        formatter?.(encoder(obj, defaults2.encoder, charset, "value", format))
      ];
    }
    return [formatter?.(prefix) + "=" + formatter?.(String(obj))];
  }
  const values = [];
  if (typeof obj === "undefined") {
    return values;
  }
  let obj_keys;
  if (generateArrayPrefix === "comma" && isArray(obj)) {
    if (encodeValuesOnly && encoder) {
      obj = maybe_map(obj, encoder);
    }
    obj_keys = [{ value: obj.length > 0 ? obj.join(",") || null : void 0 }];
  } else if (isArray(filter)) {
    obj_keys = filter;
  } else {
    const keys = Object.keys(obj);
    obj_keys = sort ? keys.sort(sort) : keys;
  }
  const encoded_prefix = encodeDotInKeys ? String(prefix).replace(/\./g, "%2E") : String(prefix);
  const adjusted_prefix = commaRoundTrip && isArray(obj) && obj.length === 1 ? encoded_prefix + "[]" : encoded_prefix;
  if (allowEmptyArrays && isArray(obj) && obj.length === 0) {
    return adjusted_prefix + "[]";
  }
  for (let j = 0; j < obj_keys.length; ++j) {
    const key = obj_keys[j];
    const value = (
      // @ts-ignore
      typeof key === "object" && typeof key.value !== "undefined" ? key.value : obj[key]
    );
    if (skipNulls && value === null) {
      continue;
    }
    const encoded_key = allowDots && encodeDotInKeys ? key.replace(/\./g, "%2E") : key;
    const key_prefix = isArray(obj) ? typeof generateArrayPrefix === "function" ? generateArrayPrefix(adjusted_prefix, encoded_key) : adjusted_prefix : adjusted_prefix + (allowDots ? "." + encoded_key : "[" + encoded_key + "]");
    sideChannel.set(object, step);
    const valueSideChannel = /* @__PURE__ */ new WeakMap();
    valueSideChannel.set(sentinel, sideChannel);
    push_to_array(values, inner_stringify(
      value,
      key_prefix,
      generateArrayPrefix,
      commaRoundTrip,
      allowEmptyArrays,
      strictNullHandling,
      skipNulls,
      encodeDotInKeys,
      // @ts-ignore
      generateArrayPrefix === "comma" && encodeValuesOnly && isArray(obj) ? null : encoder,
      filter,
      sort,
      allowDots,
      serializeDate,
      format,
      formatter,
      encodeValuesOnly,
      charset,
      valueSideChannel
    ));
  }
  return values;
}
function normalize_stringify_options(opts = defaults2) {
  if (typeof opts.allowEmptyArrays !== "undefined" && typeof opts.allowEmptyArrays !== "boolean") {
    throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");
  }
  if (typeof opts.encodeDotInKeys !== "undefined" && typeof opts.encodeDotInKeys !== "boolean") {
    throw new TypeError("`encodeDotInKeys` option can only be `true` or `false`, when provided");
  }
  if (opts.encoder !== null && typeof opts.encoder !== "undefined" && typeof opts.encoder !== "function") {
    throw new TypeError("Encoder has to be a function.");
  }
  const charset = opts.charset || defaults2.charset;
  if (typeof opts.charset !== "undefined" && opts.charset !== "utf-8" && opts.charset !== "iso-8859-1") {
    throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
  }
  let format = default_format;
  if (typeof opts.format !== "undefined") {
    if (!has(formatters, opts.format)) {
      throw new TypeError("Unknown format option provided.");
    }
    format = opts.format;
  }
  const formatter = formatters[format];
  let filter = defaults2.filter;
  if (typeof opts.filter === "function" || isArray(opts.filter)) {
    filter = opts.filter;
  }
  let arrayFormat;
  if (opts.arrayFormat && opts.arrayFormat in array_prefix_generators) {
    arrayFormat = opts.arrayFormat;
  } else if ("indices" in opts) {
    arrayFormat = opts.indices ? "indices" : "repeat";
  } else {
    arrayFormat = defaults2.arrayFormat;
  }
  if ("commaRoundTrip" in opts && typeof opts.commaRoundTrip !== "boolean") {
    throw new TypeError("`commaRoundTrip` must be a boolean, or absent");
  }
  const allowDots = typeof opts.allowDots === "undefined" ? !!opts.encodeDotInKeys === true ? true : defaults2.allowDots : !!opts.allowDots;
  return {
    addQueryPrefix: typeof opts.addQueryPrefix === "boolean" ? opts.addQueryPrefix : defaults2.addQueryPrefix,
    // @ts-ignore
    allowDots,
    allowEmptyArrays: typeof opts.allowEmptyArrays === "boolean" ? !!opts.allowEmptyArrays : defaults2.allowEmptyArrays,
    arrayFormat,
    charset,
    charsetSentinel: typeof opts.charsetSentinel === "boolean" ? opts.charsetSentinel : defaults2.charsetSentinel,
    commaRoundTrip: !!opts.commaRoundTrip,
    delimiter: typeof opts.delimiter === "undefined" ? defaults2.delimiter : opts.delimiter,
    encode: typeof opts.encode === "boolean" ? opts.encode : defaults2.encode,
    encodeDotInKeys: typeof opts.encodeDotInKeys === "boolean" ? opts.encodeDotInKeys : defaults2.encodeDotInKeys,
    encoder: typeof opts.encoder === "function" ? opts.encoder : defaults2.encoder,
    encodeValuesOnly: typeof opts.encodeValuesOnly === "boolean" ? opts.encodeValuesOnly : defaults2.encodeValuesOnly,
    filter,
    format,
    formatter,
    serializeDate: typeof opts.serializeDate === "function" ? opts.serializeDate : defaults2.serializeDate,
    skipNulls: typeof opts.skipNulls === "boolean" ? opts.skipNulls : defaults2.skipNulls,
    // @ts-ignore
    sort: typeof opts.sort === "function" ? opts.sort : null,
    strictNullHandling: typeof opts.strictNullHandling === "boolean" ? opts.strictNullHandling : defaults2.strictNullHandling
  };
}
function stringify(object, opts = {}) {
  let obj = object;
  const options = normalize_stringify_options(opts);
  let obj_keys;
  let filter;
  if (typeof options.filter === "function") {
    filter = options.filter;
    obj = filter("", obj);
  } else if (isArray(options.filter)) {
    filter = options.filter;
    obj_keys = filter;
  }
  const keys = [];
  if (typeof obj !== "object" || obj === null) {
    return "";
  }
  const generateArrayPrefix = array_prefix_generators[options.arrayFormat];
  const commaRoundTrip = generateArrayPrefix === "comma" && options.commaRoundTrip;
  if (!obj_keys) {
    obj_keys = Object.keys(obj);
  }
  if (options.sort) {
    obj_keys.sort(options.sort);
  }
  const sideChannel = /* @__PURE__ */ new WeakMap();
  for (let i = 0; i < obj_keys.length; ++i) {
    const key = obj_keys[i];
    if (options.skipNulls && obj[key] === null) {
      continue;
    }
    push_to_array(keys, inner_stringify(
      obj[key],
      key,
      // @ts-expect-error
      generateArrayPrefix,
      commaRoundTrip,
      options.allowEmptyArrays,
      options.strictNullHandling,
      options.skipNulls,
      options.encodeDotInKeys,
      options.encode ? options.encoder : null,
      options.filter,
      options.sort,
      options.allowDots,
      options.serializeDate,
      options.format,
      options.formatter,
      options.encodeValuesOnly,
      options.charset,
      sideChannel
    ));
  }
  const joined = keys.join(options.delimiter);
  let prefix = options.addQueryPrefix === true ? "?" : "";
  if (options.charsetSentinel) {
    if (options.charset === "iso-8859-1") {
      prefix += "utf8=%26%2310003%3B&";
    } else {
      prefix += "utf8=%E2%9C%93&";
    }
  }
  return joined.length > 0 ? prefix + joined : "";
}

// node_modules/openai/internal/utils/bytes.mjs
function concatBytes(buffers) {
  let length = 0;
  for (const buffer of buffers) {
    length += buffer.length;
  }
  const output = new Uint8Array(length);
  let index = 0;
  for (const buffer of buffers) {
    output.set(buffer, index);
    index += buffer.length;
  }
  return output;
}
var encodeUTF8_;
function encodeUTF8(str2) {
  let encoder;
  return (encodeUTF8_ ?? (encoder = new globalThis.TextEncoder(), encodeUTF8_ = encoder.encode.bind(encoder)))(str2);
}
var decodeUTF8_;
function decodeUTF8(bytes) {
  let decoder;
  return (decodeUTF8_ ?? (decoder = new globalThis.TextDecoder(), decodeUTF8_ = decoder.decode.bind(decoder)))(bytes);
}

// node_modules/openai/internal/decoders/line.mjs
var _LineDecoder_buffer;
var _LineDecoder_carriageReturnIndex;
var LineDecoder = class {
  constructor() {
    _LineDecoder_buffer.set(this, void 0);
    _LineDecoder_carriageReturnIndex.set(this, void 0);
    __classPrivateFieldSet(this, _LineDecoder_buffer, new Uint8Array(), "f");
    __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
  }
  decode(chunk) {
    if (chunk == null) {
      return [];
    }
    const binaryChunk = chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : typeof chunk === "string" ? encodeUTF8(chunk) : chunk;
    __classPrivateFieldSet(this, _LineDecoder_buffer, concatBytes([__classPrivateFieldGet(this, _LineDecoder_buffer, "f"), binaryChunk]), "f");
    const lines = [];
    let patternIndex;
    while ((patternIndex = findNewlineIndex(__classPrivateFieldGet(this, _LineDecoder_buffer, "f"), __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f"))) != null) {
      if (patternIndex.carriage && __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") == null) {
        __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, patternIndex.index, "f");
        continue;
      }
      if (__classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") != null && (patternIndex.index !== __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") + 1 || patternIndex.carriage)) {
        lines.push(decodeUTF8(__classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(0, __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") - 1)));
        __classPrivateFieldSet(this, _LineDecoder_buffer, __classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(__classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f")), "f");
        __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
        continue;
      }
      const endIndex = __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") !== null ? patternIndex.preceding - 1 : patternIndex.preceding;
      const line2 = decodeUTF8(__classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(0, endIndex));
      lines.push(line2);
      __classPrivateFieldSet(this, _LineDecoder_buffer, __classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(patternIndex.index), "f");
      __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
    }
    return lines;
  }
  flush() {
    if (!__classPrivateFieldGet(this, _LineDecoder_buffer, "f").length) {
      return [];
    }
    return this.decode("\n");
  }
};
_LineDecoder_buffer = /* @__PURE__ */ new WeakMap(), _LineDecoder_carriageReturnIndex = /* @__PURE__ */ new WeakMap();
LineDecoder.NEWLINE_CHARS = /* @__PURE__ */ new Set(["\n", "\r"]);
LineDecoder.NEWLINE_REGEXP = /\r\n|[\n\r]/g;
function findNewlineIndex(buffer, startIndex) {
  const newline = 10;
  const carriage = 13;
  for (let i = startIndex ?? 0; i < buffer.length; i++) {
    if (buffer[i] === newline) {
      return { preceding: i, index: i + 1, carriage: false };
    }
    if (buffer[i] === carriage) {
      return { preceding: i, index: i + 1, carriage: true };
    }
  }
  return null;
}
function findDoubleNewlineIndex(buffer) {
  const newline = 10;
  const carriage = 13;
  for (let i = 0; i < buffer.length - 1; i++) {
    if (buffer[i] === newline && buffer[i + 1] === newline) {
      return i + 2;
    }
    if (buffer[i] === carriage && buffer[i + 1] === carriage) {
      return i + 2;
    }
    if (buffer[i] === carriage && buffer[i + 1] === newline && i + 3 < buffer.length && buffer[i + 2] === carriage && buffer[i + 3] === newline) {
      return i + 4;
    }
  }
  return -1;
}

// node_modules/openai/internal/utils/log.mjs
var levelNumbers = {
  off: 0,
  error: 200,
  warn: 300,
  info: 400,
  debug: 500
};
var parseLogLevel = (maybeLevel, sourceName, client) => {
  if (!maybeLevel) {
    return void 0;
  }
  if (hasOwn(levelNumbers, maybeLevel)) {
    return maybeLevel;
  }
  loggerFor(client).warn(`${sourceName} was set to ${JSON.stringify(maybeLevel)}, expected one of ${JSON.stringify(Object.keys(levelNumbers))}`);
  return void 0;
};
function noop() {
}
function makeLogFn(fnLevel, logger, logLevel) {
  if (!logger || levelNumbers[fnLevel] > levelNumbers[logLevel]) {
    return noop;
  } else {
    return logger[fnLevel].bind(logger);
  }
}
var noopLogger = {
  error: noop,
  warn: noop,
  info: noop,
  debug: noop
};
var cachedLoggers = /* @__PURE__ */ new WeakMap();
function loggerFor(client) {
  const logger = client.logger;
  const logLevel = client.logLevel ?? "off";
  if (!logger) {
    return noopLogger;
  }
  const cachedLogger = cachedLoggers.get(logger);
  if (cachedLogger && cachedLogger[0] === logLevel) {
    return cachedLogger[1];
  }
  const levelLogger = {
    error: makeLogFn("error", logger, logLevel),
    warn: makeLogFn("warn", logger, logLevel),
    info: makeLogFn("info", logger, logLevel),
    debug: makeLogFn("debug", logger, logLevel)
  };
  cachedLoggers.set(logger, [logLevel, levelLogger]);
  return levelLogger;
}
var formatRequestDetails = (details) => {
  if (details.options) {
    details.options = { ...details.options };
    delete details.options["headers"];
  }
  if (details.headers) {
    details.headers = Object.fromEntries((details.headers instanceof Headers ? [...details.headers] : Object.entries(details.headers)).map(([name, value]) => [
      name,
      name.toLowerCase() === "authorization" || name.toLowerCase() === "cookie" || name.toLowerCase() === "set-cookie" ? "***" : value
    ]));
  }
  if ("retryOfRequestLogID" in details) {
    if (details.retryOfRequestLogID) {
      details.retryOf = details.retryOfRequestLogID;
    }
    delete details.retryOfRequestLogID;
  }
  return details;
};

// node_modules/openai/core/streaming.mjs
var _Stream_client;
var Stream = class _Stream {
  constructor(iterator, controller, client) {
    this.iterator = iterator;
    _Stream_client.set(this, void 0);
    this.controller = controller;
    __classPrivateFieldSet(this, _Stream_client, client, "f");
  }
  static fromSSEResponse(response, controller, client) {
    let consumed = false;
    const logger = client ? loggerFor(client) : console;
    async function* iterator() {
      if (consumed) {
        throw new OpenAIError("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
      }
      consumed = true;
      let done = false;
      try {
        for await (const sse of _iterSSEMessages(response, controller)) {
          if (done)
            continue;
          if (sse.data.startsWith("[DONE]")) {
            done = true;
            continue;
          }
          if (sse.event === null || !sse.event.startsWith("thread.")) {
            let data;
            try {
              data = JSON.parse(sse.data);
            } catch (e) {
              logger.error(`Could not parse message into JSON:`, sse.data);
              logger.error(`From chunk:`, sse.raw);
              throw e;
            }
            if (data && data.error) {
              throw new APIError(void 0, data.error, void 0, response.headers);
            }
            yield data;
          } else {
            let data;
            try {
              data = JSON.parse(sse.data);
            } catch (e) {
              console.error(`Could not parse message into JSON:`, sse.data);
              console.error(`From chunk:`, sse.raw);
              throw e;
            }
            if (sse.event == "error") {
              throw new APIError(void 0, data.error, data.message, void 0);
            }
            yield { event: sse.event, data };
          }
        }
        done = true;
      } catch (e) {
        if (isAbortError(e))
          return;
        throw e;
      } finally {
        if (!done)
          controller.abort();
      }
    }
    return new _Stream(iterator, controller, client);
  }
  /**
   * Generates a Stream from a newline-separated ReadableStream
   * where each item is a JSON value.
   */
  static fromReadableStream(readableStream, controller, client) {
    let consumed = false;
    async function* iterLines() {
      const lineDecoder = new LineDecoder();
      const iter = ReadableStreamToAsyncIterable(readableStream);
      for await (const chunk of iter) {
        for (const line2 of lineDecoder.decode(chunk)) {
          yield line2;
        }
      }
      for (const line2 of lineDecoder.flush()) {
        yield line2;
      }
    }
    async function* iterator() {
      if (consumed) {
        throw new OpenAIError("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
      }
      consumed = true;
      let done = false;
      try {
        for await (const line2 of iterLines()) {
          if (done)
            continue;
          if (line2)
            yield JSON.parse(line2);
        }
        done = true;
      } catch (e) {
        if (isAbortError(e))
          return;
        throw e;
      } finally {
        if (!done)
          controller.abort();
      }
    }
    return new _Stream(iterator, controller, client);
  }
  [(_Stream_client = /* @__PURE__ */ new WeakMap(), Symbol.asyncIterator)]() {
    return this.iterator();
  }
  /**
   * Splits the stream into two streams which can be
   * independently read from at different speeds.
   */
  tee() {
    const left = [];
    const right = [];
    const iterator = this.iterator();
    const teeIterator = (queue) => {
      return {
        next: () => {
          if (queue.length === 0) {
            const result = iterator.next();
            left.push(result);
            right.push(result);
          }
          return queue.shift();
        }
      };
    };
    return [
      new _Stream(() => teeIterator(left), this.controller, __classPrivateFieldGet(this, _Stream_client, "f")),
      new _Stream(() => teeIterator(right), this.controller, __classPrivateFieldGet(this, _Stream_client, "f"))
    ];
  }
  /**
   * Converts this stream to a newline-separated ReadableStream of
   * JSON stringified values in the stream
   * which can be turned back into a Stream with `Stream.fromReadableStream()`.
   */
  toReadableStream() {
    const self = this;
    let iter;
    return makeReadableStream({
      async start() {
        iter = self[Symbol.asyncIterator]();
      },
      async pull(ctrl) {
        try {
          const { value, done } = await iter.next();
          if (done)
            return ctrl.close();
          const bytes = encodeUTF8(JSON.stringify(value) + "\n");
          ctrl.enqueue(bytes);
        } catch (err) {
          ctrl.error(err);
        }
      },
      async cancel() {
        await iter.return?.();
      }
    });
  }
};
async function* _iterSSEMessages(response, controller) {
  if (!response.body) {
    controller.abort();
    if (typeof globalThis.navigator !== "undefined" && globalThis.navigator.product === "ReactNative") {
      throw new OpenAIError(`The default react-native fetch implementation does not support streaming. Please use expo/fetch: https://docs.expo.dev/versions/latest/sdk/expo/#expofetch-api`);
    }
    throw new OpenAIError(`Attempted to iterate over a response with no body`);
  }
  const sseDecoder = new SSEDecoder();
  const lineDecoder = new LineDecoder();
  const iter = ReadableStreamToAsyncIterable(response.body);
  for await (const sseChunk of iterSSEChunks(iter)) {
    for (const line2 of lineDecoder.decode(sseChunk)) {
      const sse = sseDecoder.decode(line2);
      if (sse)
        yield sse;
    }
  }
  for (const line2 of lineDecoder.flush()) {
    const sse = sseDecoder.decode(line2);
    if (sse)
      yield sse;
  }
}
async function* iterSSEChunks(iterator) {
  let data = new Uint8Array();
  for await (const chunk of iterator) {
    if (chunk == null) {
      continue;
    }
    const binaryChunk = chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : typeof chunk === "string" ? encodeUTF8(chunk) : chunk;
    let newData = new Uint8Array(data.length + binaryChunk.length);
    newData.set(data);
    newData.set(binaryChunk, data.length);
    data = newData;
    let patternIndex;
    while ((patternIndex = findDoubleNewlineIndex(data)) !== -1) {
      yield data.slice(0, patternIndex);
      data = data.slice(patternIndex);
    }
  }
  if (data.length > 0) {
    yield data;
  }
}
var SSEDecoder = class {
  constructor() {
    this.event = null;
    this.data = [];
    this.chunks = [];
  }
  decode(line2) {
    if (line2.endsWith("\r")) {
      line2 = line2.substring(0, line2.length - 1);
    }
    if (!line2) {
      if (!this.event && !this.data.length)
        return null;
      const sse = {
        event: this.event,
        data: this.data.join("\n"),
        raw: this.chunks
      };
      this.event = null;
      this.data = [];
      this.chunks = [];
      return sse;
    }
    this.chunks.push(line2);
    if (line2.startsWith(":")) {
      return null;
    }
    let [fieldname, _, value] = partition(line2, ":");
    if (value.startsWith(" ")) {
      value = value.substring(1);
    }
    if (fieldname === "event") {
      this.event = value;
    } else if (fieldname === "data") {
      this.data.push(value);
    }
    return null;
  }
};
function partition(str2, delimiter) {
  const index = str2.indexOf(delimiter);
  if (index !== -1) {
    return [str2.substring(0, index), delimiter, str2.substring(index + delimiter.length)];
  }
  return [str2, "", ""];
}

// node_modules/openai/internal/parse.mjs
async function defaultParseResponse(client, props) {
  const { response, requestLogID, retryOfRequestLogID, startTime } = props;
  const body = await (async () => {
    if (props.options.stream) {
      loggerFor(client).debug("response", response.status, response.url, response.headers, response.body);
      if (props.options.__streamClass) {
        return props.options.__streamClass.fromSSEResponse(response, props.controller, client);
      }
      return Stream.fromSSEResponse(response, props.controller, client);
    }
    if (response.status === 204) {
      return null;
    }
    if (props.options.__binaryResponse) {
      return response;
    }
    const contentType = response.headers.get("content-type");
    const mediaType = contentType?.split(";")[0]?.trim();
    const isJSON = mediaType?.includes("application/json") || mediaType?.endsWith("+json");
    if (isJSON) {
      const json2 = await response.json();
      return addRequestID(json2, response);
    }
    const text2 = await response.text();
    return text2;
  })();
  loggerFor(client).debug(`[${requestLogID}] response parsed`, formatRequestDetails({
    retryOfRequestLogID,
    url: response.url,
    status: response.status,
    body,
    durationMs: Date.now() - startTime
  }));
  return body;
}
function addRequestID(value, response) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }
  return Object.defineProperty(value, "_request_id", {
    value: response.headers.get("x-request-id"),
    enumerable: false
  });
}

// node_modules/openai/core/api-promise.mjs
var _APIPromise_client;
var APIPromise = class _APIPromise extends Promise {
  constructor(client, responsePromise, parseResponse2 = defaultParseResponse) {
    super((resolve) => {
      resolve(null);
    });
    this.responsePromise = responsePromise;
    this.parseResponse = parseResponse2;
    _APIPromise_client.set(this, void 0);
    __classPrivateFieldSet(this, _APIPromise_client, client, "f");
  }
  _thenUnwrap(transform) {
    return new _APIPromise(__classPrivateFieldGet(this, _APIPromise_client, "f"), this.responsePromise, async (client, props) => addRequestID(transform(await this.parseResponse(client, props), props), props.response));
  }
  /**
   * Gets the raw `Response` instance instead of parsing the response
   * data.
   *
   * If you want to parse the response body but still get the `Response`
   * instance, you can use {@link withResponse()}.
   *
   * 👋 Getting the wrong TypeScript type for `Response`?
   * Try setting `"moduleResolution": "NodeNext"` or add `"lib": ["DOM"]`
   * to your `tsconfig.json`.
   */
  asResponse() {
    return this.responsePromise.then((p) => p.response);
  }
  /**
   * Gets the parsed response data, the raw `Response` instance and the ID of the request,
   * returned via the X-Request-ID header which is useful for debugging requests and reporting
   * issues to OpenAI.
   *
   * If you just want to get the raw `Response` instance without parsing it,
   * you can use {@link asResponse()}.
   *
   * 👋 Getting the wrong TypeScript type for `Response`?
   * Try setting `"moduleResolution": "NodeNext"` or add `"lib": ["DOM"]`
   * to your `tsconfig.json`.
   */
  async withResponse() {
    const [data, response] = await Promise.all([this.parse(), this.asResponse()]);
    return { data, response, request_id: response.headers.get("x-request-id") };
  }
  parse() {
    if (!this.parsedPromise) {
      this.parsedPromise = this.responsePromise.then((data) => this.parseResponse(__classPrivateFieldGet(this, _APIPromise_client, "f"), data));
    }
    return this.parsedPromise;
  }
  then(onfulfilled, onrejected) {
    return this.parse().then(onfulfilled, onrejected);
  }
  catch(onrejected) {
    return this.parse().catch(onrejected);
  }
  finally(onfinally) {
    return this.parse().finally(onfinally);
  }
};
_APIPromise_client = /* @__PURE__ */ new WeakMap();

// node_modules/openai/core/pagination.mjs
var _AbstractPage_client;
var AbstractPage = class {
  constructor(client, response, body, options) {
    _AbstractPage_client.set(this, void 0);
    __classPrivateFieldSet(this, _AbstractPage_client, client, "f");
    this.options = options;
    this.response = response;
    this.body = body;
  }
  hasNextPage() {
    const items = this.getPaginatedItems();
    if (!items.length)
      return false;
    return this.nextPageRequestOptions() != null;
  }
  async getNextPage() {
    const nextOptions = this.nextPageRequestOptions();
    if (!nextOptions) {
      throw new OpenAIError("No next page expected; please check `.hasNextPage()` before calling `.getNextPage()`.");
    }
    return await __classPrivateFieldGet(this, _AbstractPage_client, "f").requestAPIList(this.constructor, nextOptions);
  }
  async *iterPages() {
    let page = this;
    yield page;
    while (page.hasNextPage()) {
      page = await page.getNextPage();
      yield page;
    }
  }
  async *[(_AbstractPage_client = /* @__PURE__ */ new WeakMap(), Symbol.asyncIterator)]() {
    for await (const page of this.iterPages()) {
      for (const item of page.getPaginatedItems()) {
        yield item;
      }
    }
  }
};
var PagePromise = class extends APIPromise {
  constructor(client, request, Page2) {
    super(client, request, async (client2, props) => new Page2(client2, props.response, await defaultParseResponse(client2, props), props.options));
  }
  /**
   * Allow auto-paginating iteration on an unawaited list call, eg:
   *
   *    for await (const item of client.items.list()) {
   *      console.log(item)
   *    }
   */
  async *[Symbol.asyncIterator]() {
    const page = await this;
    for await (const item of page) {
      yield item;
    }
  }
};
var Page = class extends AbstractPage {
  constructor(client, response, body, options) {
    super(client, response, body, options);
    this.data = body.data || [];
    this.object = body.object;
  }
  getPaginatedItems() {
    return this.data ?? [];
  }
  nextPageRequestOptions() {
    return null;
  }
};
var CursorPage = class extends AbstractPage {
  constructor(client, response, body, options) {
    super(client, response, body, options);
    this.data = body.data || [];
    this.has_more = body.has_more || false;
  }
  getPaginatedItems() {
    return this.data ?? [];
  }
  hasNextPage() {
    if (this.has_more === false) {
      return false;
    }
    return super.hasNextPage();
  }
  nextPageRequestOptions() {
    const data = this.getPaginatedItems();
    const id = data[data.length - 1]?.id;
    if (!id) {
      return null;
    }
    return {
      ...this.options,
      query: {
        ...maybeObj(this.options.query),
        after: id
      }
    };
  }
};
var ConversationCursorPage = class extends AbstractPage {
  constructor(client, response, body, options) {
    super(client, response, body, options);
    this.data = body.data || [];
    this.has_more = body.has_more || false;
    this.last_id = body.last_id || "";
  }
  getPaginatedItems() {
    return this.data ?? [];
  }
  hasNextPage() {
    if (this.has_more === false) {
      return false;
    }
    return super.hasNextPage();
  }
  nextPageRequestOptions() {
    const cursor = this.last_id;
    if (!cursor) {
      return null;
    }
    return {
      ...this.options,
      query: {
        ...maybeObj(this.options.query),
        after: cursor
      }
    };
  }
};

// node_modules/openai/internal/uploads.mjs
var checkFileSupport = () => {
  if (typeof File === "undefined") {
    const { process: process2 } = globalThis;
    const isOldNode = typeof process2?.versions?.node === "string" && parseInt(process2.versions.node.split(".")) < 20;
    throw new Error("`File` is not defined as a global, which is required for file uploads." + (isOldNode ? " Update to Node 20 LTS or newer, or set `globalThis.File` to `import('node:buffer').File`." : ""));
  }
};
function makeFile(fileBits, fileName, options) {
  checkFileSupport();
  return new File(fileBits, fileName ?? "unknown_file", options);
}
function getName(value) {
  return (typeof value === "object" && value !== null && ("name" in value && value.name && String(value.name) || "url" in value && value.url && String(value.url) || "filename" in value && value.filename && String(value.filename) || "path" in value && value.path && String(value.path)) || "").split(/[\\/]/).pop() || void 0;
}
var isAsyncIterable = (value) => value != null && typeof value === "object" && typeof value[Symbol.asyncIterator] === "function";
var maybeMultipartFormRequestOptions = async (opts, fetch2) => {
  if (!hasUploadableValue(opts.body))
    return opts;
  return { ...opts, body: await createForm(opts.body, fetch2) };
};
var multipartFormRequestOptions = async (opts, fetch2) => {
  return { ...opts, body: await createForm(opts.body, fetch2) };
};
var supportsFormDataMap = /* @__PURE__ */ new WeakMap();
function supportsFormData(fetchObject) {
  const fetch2 = typeof fetchObject === "function" ? fetchObject : fetchObject.fetch;
  const cached = supportsFormDataMap.get(fetch2);
  if (cached)
    return cached;
  const promise = (async () => {
    try {
      const FetchResponse = "Response" in fetch2 ? fetch2.Response : (await fetch2("data:,")).constructor;
      const data = new FormData();
      if (data.toString() === await new FetchResponse(data).text()) {
        return false;
      }
      return true;
    } catch {
      return true;
    }
  })();
  supportsFormDataMap.set(fetch2, promise);
  return promise;
}
var createForm = async (body, fetch2) => {
  if (!await supportsFormData(fetch2)) {
    throw new TypeError("The provided fetch function does not support file uploads with the current global FormData class.");
  }
  const form = new FormData();
  await Promise.all(Object.entries(body || {}).map(([key, value]) => addFormValue(form, key, value)));
  return form;
};
var isNamedBlob = (value) => value instanceof Blob && "name" in value;
var isUploadable = (value) => typeof value === "object" && value !== null && (value instanceof Response || isAsyncIterable(value) || isNamedBlob(value));
var hasUploadableValue = (value) => {
  if (isUploadable(value))
    return true;
  if (Array.isArray(value))
    return value.some(hasUploadableValue);
  if (value && typeof value === "object") {
    for (const k in value) {
      if (hasUploadableValue(value[k]))
        return true;
    }
  }
  return false;
};
var addFormValue = async (form, key, value) => {
  if (value === void 0)
    return;
  if (value == null) {
    throw new TypeError(`Received null for "${key}"; to pass null in FormData, you must use the string 'null'`);
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    form.append(key, String(value));
  } else if (value instanceof Response) {
    form.append(key, makeFile([await value.blob()], getName(value)));
  } else if (isAsyncIterable(value)) {
    form.append(key, makeFile([await new Response(ReadableStreamFrom(value)).blob()], getName(value)));
  } else if (isNamedBlob(value)) {
    form.append(key, value, getName(value));
  } else if (Array.isArray(value)) {
    await Promise.all(value.map((entry) => addFormValue(form, key + "[]", entry)));
  } else if (typeof value === "object") {
    await Promise.all(Object.entries(value).map(([name, prop]) => addFormValue(form, `${key}[${name}]`, prop)));
  } else {
    throw new TypeError(`Invalid value given to form, expected a string, number, boolean, object, Array, File or Blob but got ${value} instead`);
  }
};

// node_modules/openai/internal/to-file.mjs
var isBlobLike = (value) => value != null && typeof value === "object" && typeof value.size === "number" && typeof value.type === "string" && typeof value.text === "function" && typeof value.slice === "function" && typeof value.arrayBuffer === "function";
var isFileLike = (value) => value != null && typeof value === "object" && typeof value.name === "string" && typeof value.lastModified === "number" && isBlobLike(value);
var isResponseLike = (value) => value != null && typeof value === "object" && typeof value.url === "string" && typeof value.blob === "function";
async function toFile(value, name, options) {
  checkFileSupport();
  value = await value;
  if (isFileLike(value)) {
    if (value instanceof File) {
      return value;
    }
    return makeFile([await value.arrayBuffer()], value.name);
  }
  if (isResponseLike(value)) {
    const blob = await value.blob();
    name || (name = new URL(value.url).pathname.split(/[\\/]/).pop());
    return makeFile(await getBytes(blob), name, options);
  }
  const parts = await getBytes(value);
  name || (name = getName(value));
  if (!options?.type) {
    const type = parts.find((part) => typeof part === "object" && "type" in part && part.type);
    if (typeof type === "string") {
      options = { ...options, type };
    }
  }
  return makeFile(parts, name, options);
}
async function getBytes(value) {
  let parts = [];
  if (typeof value === "string" || ArrayBuffer.isView(value) || // includes Uint8Array, Buffer, etc.
  value instanceof ArrayBuffer) {
    parts.push(value);
  } else if (isBlobLike(value)) {
    parts.push(value instanceof Blob ? value : await value.arrayBuffer());
  } else if (isAsyncIterable(value)) {
    for await (const chunk of value) {
      parts.push(...await getBytes(chunk));
    }
  } else {
    const constructor = value?.constructor?.name;
    throw new Error(`Unexpected data type: ${typeof value}${constructor ? `; constructor: ${constructor}` : ""}${propsForError(value)}`);
  }
  return parts;
}
function propsForError(value) {
  if (typeof value !== "object" || value === null)
    return "";
  const props = Object.getOwnPropertyNames(value);
  return `; props: [${props.map((p) => `"${p}"`).join(", ")}]`;
}

// node_modules/openai/core/resource.mjs
var APIResource = class {
  constructor(client) {
    this._client = client;
  }
};

// node_modules/openai/internal/utils/path.mjs
function encodeURIPath(str2) {
  return str2.replace(/[^A-Za-z0-9\-._~!$&'()*+,;=:@]+/g, encodeURIComponent);
}
var EMPTY = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.create(null));
var createPathTagFunction = (pathEncoder = encodeURIPath) => function path2(statics, ...params) {
  if (statics.length === 1)
    return statics[0];
  let postPath = false;
  const invalidSegments = [];
  const path3 = statics.reduce((previousValue, currentValue, index) => {
    if (/[?#]/.test(currentValue)) {
      postPath = true;
    }
    const value = params[index];
    let encoded = (postPath ? encodeURIComponent : pathEncoder)("" + value);
    if (index !== params.length && (value == null || typeof value === "object" && // handle values from other realms
    value.toString === Object.getPrototypeOf(Object.getPrototypeOf(value.hasOwnProperty ?? EMPTY) ?? EMPTY)?.toString)) {
      encoded = value + "";
      invalidSegments.push({
        start: previousValue.length + currentValue.length,
        length: encoded.length,
        error: `Value of type ${Object.prototype.toString.call(value).slice(8, -1)} is not a valid path parameter`
      });
    }
    return previousValue + currentValue + (index === params.length ? "" : encoded);
  }, "");
  const pathOnly = path3.split(/[?#]/, 1)[0];
  const invalidSegmentPattern = /(?<=^|\/)(?:\.|%2e){1,2}(?=\/|$)/gi;
  let match;
  while ((match = invalidSegmentPattern.exec(pathOnly)) !== null) {
    invalidSegments.push({
      start: match.index,
      length: match[0].length,
      error: `Value "${match[0]}" can't be safely passed as a path parameter`
    });
  }
  invalidSegments.sort((a, b) => a.start - b.start);
  if (invalidSegments.length > 0) {
    let lastEnd = 0;
    const underline = invalidSegments.reduce((acc, segment) => {
      const spaces = " ".repeat(segment.start - lastEnd);
      const arrows = "^".repeat(segment.length);
      lastEnd = segment.start + segment.length;
      return acc + spaces + arrows;
    }, "");
    throw new OpenAIError(`Path parameters result in path with invalid segments:
${invalidSegments.map((e) => e.error).join("\n")}
${path3}
${underline}`);
  }
  return path3;
};
var path = /* @__PURE__ */ createPathTagFunction(encodeURIPath);

// node_modules/openai/resources/chat/completions/messages.mjs
var Messages = class extends APIResource {
  /**
   * Get the messages in a stored chat completion. Only Chat Completions that have
   * been created with the `store` parameter set to `true` will be returned.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const chatCompletionStoreMessage of client.chat.completions.messages.list(
   *   'completion_id',
   * )) {
   *   // ...
   * }
   * ```
   */
  list(completionID, query = {}, options) {
    return this._client.getAPIList(path`/chat/completions/${completionID}/messages`, CursorPage, { query, ...options });
  }
};

// node_modules/openai/lib/parser.mjs
function isChatCompletionFunctionTool(tool) {
  return tool !== void 0 && "function" in tool && tool.function !== void 0;
}
function isAutoParsableResponseFormat(response_format) {
  return response_format?.["$brand"] === "auto-parseable-response-format";
}
function isAutoParsableTool(tool) {
  return tool?.["$brand"] === "auto-parseable-tool";
}
function maybeParseChatCompletion(completion, params) {
  if (!params || !hasAutoParseableInput(params)) {
    return {
      ...completion,
      choices: completion.choices.map((choice) => {
        assertToolCallsAreChatCompletionFunctionToolCalls(choice.message.tool_calls);
        return {
          ...choice,
          message: {
            ...choice.message,
            parsed: null,
            ...choice.message.tool_calls ? {
              tool_calls: choice.message.tool_calls
            } : void 0
          }
        };
      })
    };
  }
  return parseChatCompletion(completion, params);
}
function parseChatCompletion(completion, params) {
  const choices = completion.choices.map((choice) => {
    if (choice.finish_reason === "length") {
      throw new LengthFinishReasonError();
    }
    if (choice.finish_reason === "content_filter") {
      throw new ContentFilterFinishReasonError();
    }
    assertToolCallsAreChatCompletionFunctionToolCalls(choice.message.tool_calls);
    return {
      ...choice,
      message: {
        ...choice.message,
        ...choice.message.tool_calls ? {
          tool_calls: choice.message.tool_calls?.map((toolCall) => parseToolCall(params, toolCall)) ?? void 0
        } : void 0,
        parsed: choice.message.content && !choice.message.refusal ? parseResponseFormat(params, choice.message.content) : null
      }
    };
  });
  return { ...completion, choices };
}
function parseResponseFormat(params, content) {
  if (params.response_format?.type !== "json_schema") {
    return null;
  }
  if (params.response_format?.type === "json_schema") {
    if ("$parseRaw" in params.response_format) {
      const response_format = params.response_format;
      return response_format.$parseRaw(content);
    }
    return JSON.parse(content);
  }
  return null;
}
function parseToolCall(params, toolCall) {
  const inputTool = params.tools?.find((inputTool2) => isChatCompletionFunctionTool(inputTool2) && inputTool2.function?.name === toolCall.function.name);
  return {
    ...toolCall,
    function: {
      ...toolCall.function,
      parsed_arguments: isAutoParsableTool(inputTool) ? inputTool.$parseRaw(toolCall.function.arguments) : inputTool?.function.strict ? JSON.parse(toolCall.function.arguments) : null
    }
  };
}
function shouldParseToolCall(params, toolCall) {
  if (!params || !("tools" in params) || !params.tools) {
    return false;
  }
  const inputTool = params.tools?.find((inputTool2) => isChatCompletionFunctionTool(inputTool2) && inputTool2.function?.name === toolCall.function.name);
  return isChatCompletionFunctionTool(inputTool) && (isAutoParsableTool(inputTool) || inputTool?.function.strict || false);
}
function hasAutoParseableInput(params) {
  if (isAutoParsableResponseFormat(params.response_format)) {
    return true;
  }
  return params.tools?.some((t) => isAutoParsableTool(t) || t.type === "function" && t.function.strict === true) ?? false;
}
function assertToolCallsAreChatCompletionFunctionToolCalls(toolCalls) {
  for (const toolCall of toolCalls || []) {
    if (toolCall.type !== "function") {
      throw new OpenAIError(`Currently only \`function\` tool calls are supported; Received \`${toolCall.type}\``);
    }
  }
}
function validateInputTools(tools) {
  for (const tool of tools ?? []) {
    if (tool.type !== "function") {
      throw new OpenAIError(`Currently only \`function\` tool types support auto-parsing; Received \`${tool.type}\``);
    }
    if (tool.function.strict !== true) {
      throw new OpenAIError(`The \`${tool.function.name}\` tool is not marked with \`strict: true\`. Only strict function tools can be auto-parsed`);
    }
  }
}

// node_modules/openai/lib/chatCompletionUtils.mjs
var isAssistantMessage = (message) => {
  return message?.role === "assistant";
};
var isToolMessage = (message) => {
  return message?.role === "tool";
};

// node_modules/openai/lib/EventStream.mjs
var _EventStream_instances;
var _EventStream_connectedPromise;
var _EventStream_resolveConnectedPromise;
var _EventStream_rejectConnectedPromise;
var _EventStream_endPromise;
var _EventStream_resolveEndPromise;
var _EventStream_rejectEndPromise;
var _EventStream_listeners;
var _EventStream_ended;
var _EventStream_errored;
var _EventStream_aborted;
var _EventStream_catchingPromiseCreated;
var _EventStream_handleError;
var EventStream = class {
  constructor() {
    _EventStream_instances.add(this);
    this.controller = new AbortController();
    _EventStream_connectedPromise.set(this, void 0);
    _EventStream_resolveConnectedPromise.set(this, () => {
    });
    _EventStream_rejectConnectedPromise.set(this, () => {
    });
    _EventStream_endPromise.set(this, void 0);
    _EventStream_resolveEndPromise.set(this, () => {
    });
    _EventStream_rejectEndPromise.set(this, () => {
    });
    _EventStream_listeners.set(this, {});
    _EventStream_ended.set(this, false);
    _EventStream_errored.set(this, false);
    _EventStream_aborted.set(this, false);
    _EventStream_catchingPromiseCreated.set(this, false);
    __classPrivateFieldSet(this, _EventStream_connectedPromise, new Promise((resolve, reject) => {
      __classPrivateFieldSet(this, _EventStream_resolveConnectedPromise, resolve, "f");
      __classPrivateFieldSet(this, _EventStream_rejectConnectedPromise, reject, "f");
    }), "f");
    __classPrivateFieldSet(this, _EventStream_endPromise, new Promise((resolve, reject) => {
      __classPrivateFieldSet(this, _EventStream_resolveEndPromise, resolve, "f");
      __classPrivateFieldSet(this, _EventStream_rejectEndPromise, reject, "f");
    }), "f");
    __classPrivateFieldGet(this, _EventStream_connectedPromise, "f").catch(() => {
    });
    __classPrivateFieldGet(this, _EventStream_endPromise, "f").catch(() => {
    });
  }
  _run(executor) {
    setTimeout(() => {
      executor().then(() => {
        this._emitFinal();
        this._emit("end");
      }, __classPrivateFieldGet(this, _EventStream_instances, "m", _EventStream_handleError).bind(this));
    }, 0);
  }
  _connected() {
    if (this.ended)
      return;
    __classPrivateFieldGet(this, _EventStream_resolveConnectedPromise, "f").call(this);
    this._emit("connect");
  }
  get ended() {
    return __classPrivateFieldGet(this, _EventStream_ended, "f");
  }
  get errored() {
    return __classPrivateFieldGet(this, _EventStream_errored, "f");
  }
  get aborted() {
    return __classPrivateFieldGet(this, _EventStream_aborted, "f");
  }
  abort() {
    this.controller.abort();
  }
  /**
   * Adds the listener function to the end of the listeners array for the event.
   * No checks are made to see if the listener has already been added. Multiple calls passing
   * the same combination of event and listener will result in the listener being added, and
   * called, multiple times.
   * @returns this ChatCompletionStream, so that calls can be chained
   */
  on(event, listener) {
    const listeners = __classPrivateFieldGet(this, _EventStream_listeners, "f")[event] || (__classPrivateFieldGet(this, _EventStream_listeners, "f")[event] = []);
    listeners.push({ listener });
    return this;
  }
  /**
   * Removes the specified listener from the listener array for the event.
   * off() will remove, at most, one instance of a listener from the listener array. If any single
   * listener has been added multiple times to the listener array for the specified event, then
   * off() must be called multiple times to remove each instance.
   * @returns this ChatCompletionStream, so that calls can be chained
   */
  off(event, listener) {
    const listeners = __classPrivateFieldGet(this, _EventStream_listeners, "f")[event];
    if (!listeners)
      return this;
    const index = listeners.findIndex((l) => l.listener === listener);
    if (index >= 0)
      listeners.splice(index, 1);
    return this;
  }
  /**
   * Adds a one-time listener function for the event. The next time the event is triggered,
   * this listener is removed and then invoked.
   * @returns this ChatCompletionStream, so that calls can be chained
   */
  once(event, listener) {
    const listeners = __classPrivateFieldGet(this, _EventStream_listeners, "f")[event] || (__classPrivateFieldGet(this, _EventStream_listeners, "f")[event] = []);
    listeners.push({ listener, once: true });
    return this;
  }
  /**
   * This is similar to `.once()`, but returns a Promise that resolves the next time
   * the event is triggered, instead of calling a listener callback.
   * @returns a Promise that resolves the next time given event is triggered,
   * or rejects if an error is emitted.  (If you request the 'error' event,
   * returns a promise that resolves with the error).
   *
   * Example:
   *
   *   const message = await stream.emitted('message') // rejects if the stream errors
   */
  emitted(event) {
    return new Promise((resolve, reject) => {
      __classPrivateFieldSet(this, _EventStream_catchingPromiseCreated, true, "f");
      if (event !== "error")
        this.once("error", reject);
      this.once(event, resolve);
    });
  }
  async done() {
    __classPrivateFieldSet(this, _EventStream_catchingPromiseCreated, true, "f");
    await __classPrivateFieldGet(this, _EventStream_endPromise, "f");
  }
  _emit(event, ...args) {
    if (__classPrivateFieldGet(this, _EventStream_ended, "f")) {
      return;
    }
    if (event === "end") {
      __classPrivateFieldSet(this, _EventStream_ended, true, "f");
      __classPrivateFieldGet(this, _EventStream_resolveEndPromise, "f").call(this);
    }
    const listeners = __classPrivateFieldGet(this, _EventStream_listeners, "f")[event];
    if (listeners) {
      __classPrivateFieldGet(this, _EventStream_listeners, "f")[event] = listeners.filter((l) => !l.once);
      listeners.forEach(({ listener }) => listener(...args));
    }
    if (event === "abort") {
      const error = args[0];
      if (!__classPrivateFieldGet(this, _EventStream_catchingPromiseCreated, "f") && !listeners?.length) {
        Promise.reject(error);
      }
      __classPrivateFieldGet(this, _EventStream_rejectConnectedPromise, "f").call(this, error);
      __classPrivateFieldGet(this, _EventStream_rejectEndPromise, "f").call(this, error);
      this._emit("end");
      return;
    }
    if (event === "error") {
      const error = args[0];
      if (!__classPrivateFieldGet(this, _EventStream_catchingPromiseCreated, "f") && !listeners?.length) {
        Promise.reject(error);
      }
      __classPrivateFieldGet(this, _EventStream_rejectConnectedPromise, "f").call(this, error);
      __classPrivateFieldGet(this, _EventStream_rejectEndPromise, "f").call(this, error);
      this._emit("end");
    }
  }
  _emitFinal() {
  }
};
_EventStream_connectedPromise = /* @__PURE__ */ new WeakMap(), _EventStream_resolveConnectedPromise = /* @__PURE__ */ new WeakMap(), _EventStream_rejectConnectedPromise = /* @__PURE__ */ new WeakMap(), _EventStream_endPromise = /* @__PURE__ */ new WeakMap(), _EventStream_resolveEndPromise = /* @__PURE__ */ new WeakMap(), _EventStream_rejectEndPromise = /* @__PURE__ */ new WeakMap(), _EventStream_listeners = /* @__PURE__ */ new WeakMap(), _EventStream_ended = /* @__PURE__ */ new WeakMap(), _EventStream_errored = /* @__PURE__ */ new WeakMap(), _EventStream_aborted = /* @__PURE__ */ new WeakMap(), _EventStream_catchingPromiseCreated = /* @__PURE__ */ new WeakMap(), _EventStream_instances = /* @__PURE__ */ new WeakSet(), _EventStream_handleError = function _EventStream_handleError2(error) {
  __classPrivateFieldSet(this, _EventStream_errored, true, "f");
  if (error instanceof Error && error.name === "AbortError") {
    error = new APIUserAbortError();
  }
  if (error instanceof APIUserAbortError) {
    __classPrivateFieldSet(this, _EventStream_aborted, true, "f");
    return this._emit("abort", error);
  }
  if (error instanceof OpenAIError) {
    return this._emit("error", error);
  }
  if (error instanceof Error) {
    const openAIError = new OpenAIError(error.message);
    openAIError.cause = error;
    return this._emit("error", openAIError);
  }
  return this._emit("error", new OpenAIError(String(error)));
};

// node_modules/openai/lib/RunnableFunction.mjs
function isRunnableFunctionWithParse(fn) {
  return typeof fn.parse === "function";
}

// node_modules/openai/lib/AbstractChatCompletionRunner.mjs
var _AbstractChatCompletionRunner_instances;
var _AbstractChatCompletionRunner_getFinalContent;
var _AbstractChatCompletionRunner_getFinalMessage;
var _AbstractChatCompletionRunner_getFinalFunctionToolCall;
var _AbstractChatCompletionRunner_getFinalFunctionToolCallResult;
var _AbstractChatCompletionRunner_calculateTotalUsage;
var _AbstractChatCompletionRunner_validateParams;
var _AbstractChatCompletionRunner_stringifyFunctionCallResult;
var DEFAULT_MAX_CHAT_COMPLETIONS = 10;
var AbstractChatCompletionRunner = class extends EventStream {
  constructor() {
    super(...arguments);
    _AbstractChatCompletionRunner_instances.add(this);
    this._chatCompletions = [];
    this.messages = [];
  }
  _addChatCompletion(chatCompletion) {
    this._chatCompletions.push(chatCompletion);
    this._emit("chatCompletion", chatCompletion);
    const message = chatCompletion.choices[0]?.message;
    if (message)
      this._addMessage(message);
    return chatCompletion;
  }
  _addMessage(message, emit = true) {
    if (!("content" in message))
      message.content = null;
    this.messages.push(message);
    if (emit) {
      this._emit("message", message);
      if (isToolMessage(message) && message.content) {
        this._emit("functionToolCallResult", message.content);
      } else if (isAssistantMessage(message) && message.tool_calls) {
        for (const tool_call of message.tool_calls) {
          if (tool_call.type === "function") {
            this._emit("functionToolCall", tool_call.function);
          }
        }
      }
    }
  }
  /**
   * @returns a promise that resolves with the final ChatCompletion, or rejects
   * if an error occurred or the stream ended prematurely without producing a ChatCompletion.
   */
  async finalChatCompletion() {
    await this.done();
    const completion = this._chatCompletions[this._chatCompletions.length - 1];
    if (!completion)
      throw new OpenAIError("stream ended without producing a ChatCompletion");
    return completion;
  }
  /**
   * @returns a promise that resolves with the content of the final ChatCompletionMessage, or rejects
   * if an error occurred or the stream ended prematurely without producing a ChatCompletionMessage.
   */
  async finalContent() {
    await this.done();
    return __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalContent).call(this);
  }
  /**
   * @returns a promise that resolves with the the final assistant ChatCompletionMessage response,
   * or rejects if an error occurred or the stream ended prematurely without producing a ChatCompletionMessage.
   */
  async finalMessage() {
    await this.done();
    return __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalMessage).call(this);
  }
  /**
   * @returns a promise that resolves with the content of the final FunctionCall, or rejects
   * if an error occurred or the stream ended prematurely without producing a ChatCompletionMessage.
   */
  async finalFunctionToolCall() {
    await this.done();
    return __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalFunctionToolCall).call(this);
  }
  async finalFunctionToolCallResult() {
    await this.done();
    return __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalFunctionToolCallResult).call(this);
  }
  async totalUsage() {
    await this.done();
    return __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_calculateTotalUsage).call(this);
  }
  allChatCompletions() {
    return [...this._chatCompletions];
  }
  _emitFinal() {
    const completion = this._chatCompletions[this._chatCompletions.length - 1];
    if (completion)
      this._emit("finalChatCompletion", completion);
    const finalMessage = __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalMessage).call(this);
    if (finalMessage)
      this._emit("finalMessage", finalMessage);
    const finalContent = __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalContent).call(this);
    if (finalContent)
      this._emit("finalContent", finalContent);
    const finalFunctionCall = __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalFunctionToolCall).call(this);
    if (finalFunctionCall)
      this._emit("finalFunctionToolCall", finalFunctionCall);
    const finalFunctionCallResult = __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalFunctionToolCallResult).call(this);
    if (finalFunctionCallResult != null)
      this._emit("finalFunctionToolCallResult", finalFunctionCallResult);
    if (this._chatCompletions.some((c) => c.usage)) {
      this._emit("totalUsage", __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_calculateTotalUsage).call(this));
    }
  }
  async _createChatCompletion(client, params, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_validateParams).call(this, params);
    const chatCompletion = await client.chat.completions.create({ ...params, stream: false }, { ...options, signal: this.controller.signal });
    this._connected();
    return this._addChatCompletion(parseChatCompletion(chatCompletion, params));
  }
  async _runChatCompletion(client, params, options) {
    for (const message of params.messages) {
      this._addMessage(message, false);
    }
    return await this._createChatCompletion(client, params, options);
  }
  async _runTools(client, params, options) {
    const role = "tool";
    const { tool_choice = "auto", stream, ...restParams } = params;
    const singleFunctionToCall = typeof tool_choice !== "string" && tool_choice.type === "function" && tool_choice?.function?.name;
    const { maxChatCompletions = DEFAULT_MAX_CHAT_COMPLETIONS } = options || {};
    const inputTools = params.tools.map((tool) => {
      if (isAutoParsableTool(tool)) {
        if (!tool.$callback) {
          throw new OpenAIError("Tool given to `.runTools()` that does not have an associated function");
        }
        return {
          type: "function",
          function: {
            function: tool.$callback,
            name: tool.function.name,
            description: tool.function.description || "",
            parameters: tool.function.parameters,
            parse: tool.$parseRaw,
            strict: true
          }
        };
      }
      return tool;
    });
    const functionsByName = {};
    for (const f of inputTools) {
      if (f.type === "function") {
        functionsByName[f.function.name || f.function.function.name] = f.function;
      }
    }
    const tools = "tools" in params ? inputTools.map((t) => t.type === "function" ? {
      type: "function",
      function: {
        name: t.function.name || t.function.function.name,
        parameters: t.function.parameters,
        description: t.function.description,
        strict: t.function.strict
      }
    } : t) : void 0;
    for (const message of params.messages) {
      this._addMessage(message, false);
    }
    for (let i = 0; i < maxChatCompletions; ++i) {
      const chatCompletion = await this._createChatCompletion(client, {
        ...restParams,
        tool_choice,
        tools,
        messages: [...this.messages]
      }, options);
      const message = chatCompletion.choices[0]?.message;
      if (!message) {
        throw new OpenAIError(`missing message in ChatCompletion response`);
      }
      if (!message.tool_calls?.length) {
        return;
      }
      for (const tool_call of message.tool_calls) {
        if (tool_call.type !== "function")
          continue;
        const tool_call_id = tool_call.id;
        const { name, arguments: args } = tool_call.function;
        const fn = functionsByName[name];
        if (!fn) {
          const content2 = `Invalid tool_call: ${JSON.stringify(name)}. Available options are: ${Object.keys(functionsByName).map((name2) => JSON.stringify(name2)).join(", ")}. Please try again`;
          this._addMessage({ role, tool_call_id, content: content2 });
          continue;
        } else if (singleFunctionToCall && singleFunctionToCall !== name) {
          const content2 = `Invalid tool_call: ${JSON.stringify(name)}. ${JSON.stringify(singleFunctionToCall)} requested. Please try again`;
          this._addMessage({ role, tool_call_id, content: content2 });
          continue;
        }
        let parsed;
        try {
          parsed = isRunnableFunctionWithParse(fn) ? await fn.parse(args) : args;
        } catch (error) {
          const content2 = error instanceof Error ? error.message : String(error);
          this._addMessage({ role, tool_call_id, content: content2 });
          continue;
        }
        const rawContent = await fn.function(parsed, this);
        const content = __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_stringifyFunctionCallResult).call(this, rawContent);
        this._addMessage({ role, tool_call_id, content });
        if (singleFunctionToCall) {
          return;
        }
      }
    }
    return;
  }
};
_AbstractChatCompletionRunner_instances = /* @__PURE__ */ new WeakSet(), _AbstractChatCompletionRunner_getFinalContent = function _AbstractChatCompletionRunner_getFinalContent2() {
  return __classPrivateFieldGet(this, _AbstractChatCompletionRunner_instances, "m", _AbstractChatCompletionRunner_getFinalMessage).call(this).content ?? null;
}, _AbstractChatCompletionRunner_getFinalMessage = function _AbstractChatCompletionRunner_getFinalMessage2() {
  let i = this.messages.length;
  while (i-- > 0) {
    const message = this.messages[i];
    if (isAssistantMessage(message)) {
      const ret = {
        ...message,
        content: message.content ?? null,
        refusal: message.refusal ?? null
      };
      return ret;
    }
  }
  throw new OpenAIError("stream ended without producing a ChatCompletionMessage with role=assistant");
}, _AbstractChatCompletionRunner_getFinalFunctionToolCall = function _AbstractChatCompletionRunner_getFinalFunctionToolCall2() {
  for (let i = this.messages.length - 1; i >= 0; i--) {
    const message = this.messages[i];
    if (isAssistantMessage(message) && message?.tool_calls?.length) {
      return message.tool_calls.filter((x) => x.type === "function").at(-1)?.function;
    }
  }
  return;
}, _AbstractChatCompletionRunner_getFinalFunctionToolCallResult = function _AbstractChatCompletionRunner_getFinalFunctionToolCallResult2() {
  for (let i = this.messages.length - 1; i >= 0; i--) {
    const message = this.messages[i];
    if (isToolMessage(message) && message.content != null && typeof message.content === "string" && this.messages.some((x) => x.role === "assistant" && x.tool_calls?.some((y) => y.type === "function" && y.id === message.tool_call_id))) {
      return message.content;
    }
  }
  return;
}, _AbstractChatCompletionRunner_calculateTotalUsage = function _AbstractChatCompletionRunner_calculateTotalUsage2() {
  const total = {
    completion_tokens: 0,
    prompt_tokens: 0,
    total_tokens: 0
  };
  for (const { usage } of this._chatCompletions) {
    if (usage) {
      total.completion_tokens += usage.completion_tokens;
      total.prompt_tokens += usage.prompt_tokens;
      total.total_tokens += usage.total_tokens;
    }
  }
  return total;
}, _AbstractChatCompletionRunner_validateParams = function _AbstractChatCompletionRunner_validateParams2(params) {
  if (params.n != null && params.n > 1) {
    throw new OpenAIError("ChatCompletion convenience helpers only support n=1 at this time. To use n>1, please use chat.completions.create() directly.");
  }
}, _AbstractChatCompletionRunner_stringifyFunctionCallResult = function _AbstractChatCompletionRunner_stringifyFunctionCallResult2(rawContent) {
  return typeof rawContent === "string" ? rawContent : rawContent === void 0 ? "undefined" : JSON.stringify(rawContent);
};

// node_modules/openai/lib/ChatCompletionRunner.mjs
var ChatCompletionRunner = class _ChatCompletionRunner extends AbstractChatCompletionRunner {
  static runTools(client, params, options) {
    const runner = new _ChatCompletionRunner();
    const opts = {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "runTools" }
    };
    runner._run(() => runner._runTools(client, params, opts));
    return runner;
  }
  _addMessage(message, emit = true) {
    super._addMessage(message, emit);
    if (isAssistantMessage(message) && message.content) {
      this._emit("content", message.content);
    }
  }
};

// node_modules/openai/_vendor/partial-json-parser/parser.mjs
var STR = 1;
var NUM = 2;
var ARR = 4;
var OBJ = 8;
var NULL = 16;
var BOOL = 32;
var NAN = 64;
var INFINITY = 128;
var MINUS_INFINITY = 256;
var INF = INFINITY | MINUS_INFINITY;
var SPECIAL = NULL | BOOL | INF | NAN;
var ATOM = STR | NUM | SPECIAL;
var COLLECTION = ARR | OBJ;
var ALL = ATOM | COLLECTION;
var Allow = {
  STR,
  NUM,
  ARR,
  OBJ,
  NULL,
  BOOL,
  NAN,
  INFINITY,
  MINUS_INFINITY,
  INF,
  SPECIAL,
  ATOM,
  COLLECTION,
  ALL
};
var PartialJSON = class extends Error {
};
var MalformedJSON = class extends Error {
};
function parseJSON(jsonString, allowPartial = Allow.ALL) {
  if (typeof jsonString !== "string") {
    throw new TypeError(`expecting str, got ${typeof jsonString}`);
  }
  if (!jsonString.trim()) {
    throw new Error(`${jsonString} is empty`);
  }
  return _parseJSON(jsonString.trim(), allowPartial);
}
var _parseJSON = (jsonString, allow) => {
  const length = jsonString.length;
  let index = 0;
  const markPartialJSON = (msg) => {
    throw new PartialJSON(`${msg} at position ${index}`);
  };
  const throwMalformedError = (msg) => {
    throw new MalformedJSON(`${msg} at position ${index}`);
  };
  const parseAny = () => {
    skipBlank();
    if (index >= length)
      markPartialJSON("Unexpected end of input");
    if (jsonString[index] === '"')
      return parseStr();
    if (jsonString[index] === "{")
      return parseObj();
    if (jsonString[index] === "[")
      return parseArr();
    if (jsonString.substring(index, index + 4) === "null" || Allow.NULL & allow && length - index < 4 && "null".startsWith(jsonString.substring(index))) {
      index += 4;
      return null;
    }
    if (jsonString.substring(index, index + 4) === "true" || Allow.BOOL & allow && length - index < 4 && "true".startsWith(jsonString.substring(index))) {
      index += 4;
      return true;
    }
    if (jsonString.substring(index, index + 5) === "false" || Allow.BOOL & allow && length - index < 5 && "false".startsWith(jsonString.substring(index))) {
      index += 5;
      return false;
    }
    if (jsonString.substring(index, index + 8) === "Infinity" || Allow.INFINITY & allow && length - index < 8 && "Infinity".startsWith(jsonString.substring(index))) {
      index += 8;
      return Infinity;
    }
    if (jsonString.substring(index, index + 9) === "-Infinity" || Allow.MINUS_INFINITY & allow && 1 < length - index && length - index < 9 && "-Infinity".startsWith(jsonString.substring(index))) {
      index += 9;
      return -Infinity;
    }
    if (jsonString.substring(index, index + 3) === "NaN" || Allow.NAN & allow && length - index < 3 && "NaN".startsWith(jsonString.substring(index))) {
      index += 3;
      return NaN;
    }
    return parseNum();
  };
  const parseStr = () => {
    const start = index;
    let escape2 = false;
    index++;
    while (index < length && (jsonString[index] !== '"' || escape2 && jsonString[index - 1] === "\\")) {
      escape2 = jsonString[index] === "\\" ? !escape2 : false;
      index++;
    }
    if (jsonString.charAt(index) == '"') {
      try {
        return JSON.parse(jsonString.substring(start, ++index - Number(escape2)));
      } catch (e) {
        throwMalformedError(String(e));
      }
    } else if (Allow.STR & allow) {
      try {
        return JSON.parse(jsonString.substring(start, index - Number(escape2)) + '"');
      } catch (e) {
        return JSON.parse(jsonString.substring(start, jsonString.lastIndexOf("\\")) + '"');
      }
    }
    markPartialJSON("Unterminated string literal");
  };
  const parseObj = () => {
    index++;
    skipBlank();
    const obj = {};
    try {
      while (jsonString[index] !== "}") {
        skipBlank();
        if (index >= length && Allow.OBJ & allow)
          return obj;
        const key = parseStr();
        skipBlank();
        index++;
        try {
          const value = parseAny();
          Object.defineProperty(obj, key, { value, writable: true, enumerable: true, configurable: true });
        } catch (e) {
          if (Allow.OBJ & allow)
            return obj;
          else
            throw e;
        }
        skipBlank();
        if (jsonString[index] === ",")
          index++;
      }
    } catch (e) {
      if (Allow.OBJ & allow)
        return obj;
      else
        markPartialJSON("Expected '}' at end of object");
    }
    index++;
    return obj;
  };
  const parseArr = () => {
    index++;
    const arr = [];
    try {
      while (jsonString[index] !== "]") {
        arr.push(parseAny());
        skipBlank();
        if (jsonString[index] === ",") {
          index++;
        }
      }
    } catch (e) {
      if (Allow.ARR & allow) {
        return arr;
      }
      markPartialJSON("Expected ']' at end of array");
    }
    index++;
    return arr;
  };
  const parseNum = () => {
    if (index === 0) {
      if (jsonString === "-" && Allow.NUM & allow)
        markPartialJSON("Not sure what '-' is");
      try {
        return JSON.parse(jsonString);
      } catch (e) {
        if (Allow.NUM & allow) {
          try {
            if ("." === jsonString[jsonString.length - 1])
              return JSON.parse(jsonString.substring(0, jsonString.lastIndexOf(".")));
            return JSON.parse(jsonString.substring(0, jsonString.lastIndexOf("e")));
          } catch (e2) {
          }
        }
        throwMalformedError(String(e));
      }
    }
    const start = index;
    if (jsonString[index] === "-")
      index++;
    while (jsonString[index] && !",]}".includes(jsonString[index]))
      index++;
    if (index == length && !(Allow.NUM & allow))
      markPartialJSON("Unterminated number literal");
    try {
      return JSON.parse(jsonString.substring(start, index));
    } catch (e) {
      if (jsonString.substring(start, index) === "-" && Allow.NUM & allow)
        markPartialJSON("Not sure what '-' is");
      try {
        return JSON.parse(jsonString.substring(start, jsonString.lastIndexOf("e")));
      } catch (e2) {
        throwMalformedError(String(e2));
      }
    }
  };
  const skipBlank = () => {
    while (index < length && " \n\r	".includes(jsonString[index])) {
      index++;
    }
  };
  return parseAny();
};
var partialParse = (input) => parseJSON(input, Allow.ALL ^ Allow.NUM);

// node_modules/openai/lib/ChatCompletionStream.mjs
var _ChatCompletionStream_instances;
var _ChatCompletionStream_params;
var _ChatCompletionStream_choiceEventStates;
var _ChatCompletionStream_currentChatCompletionSnapshot;
var _ChatCompletionStream_beginRequest;
var _ChatCompletionStream_getChoiceEventState;
var _ChatCompletionStream_addChunk;
var _ChatCompletionStream_emitToolCallDoneEvent;
var _ChatCompletionStream_emitContentDoneEvents;
var _ChatCompletionStream_endRequest;
var _ChatCompletionStream_getAutoParseableResponseFormat;
var _ChatCompletionStream_accumulateChatCompletion;
var ChatCompletionStream = class _ChatCompletionStream extends AbstractChatCompletionRunner {
  constructor(params) {
    super();
    _ChatCompletionStream_instances.add(this);
    _ChatCompletionStream_params.set(this, void 0);
    _ChatCompletionStream_choiceEventStates.set(this, void 0);
    _ChatCompletionStream_currentChatCompletionSnapshot.set(this, void 0);
    __classPrivateFieldSet(this, _ChatCompletionStream_params, params, "f");
    __classPrivateFieldSet(this, _ChatCompletionStream_choiceEventStates, [], "f");
  }
  get currentChatCompletionSnapshot() {
    return __classPrivateFieldGet(this, _ChatCompletionStream_currentChatCompletionSnapshot, "f");
  }
  /**
   * Intended for use on the frontend, consuming a stream produced with
   * `.toReadableStream()` on the backend.
   *
   * Note that messages sent to the model do not appear in `.on('message')`
   * in this context.
   */
  static fromReadableStream(stream) {
    const runner = new _ChatCompletionStream(null);
    runner._run(() => runner._fromReadableStream(stream));
    return runner;
  }
  static createChatCompletion(client, params, options) {
    const runner = new _ChatCompletionStream(params);
    runner._run(() => runner._runChatCompletion(client, { ...params, stream: true }, { ...options, headers: { ...options?.headers, "X-Stainless-Helper-Method": "stream" } }));
    return runner;
  }
  async _createChatCompletion(client, params, options) {
    super._createChatCompletion;
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_beginRequest).call(this);
    const stream = await client.chat.completions.create({ ...params, stream: true }, { ...options, signal: this.controller.signal });
    this._connected();
    for await (const chunk of stream) {
      __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_addChunk).call(this, chunk);
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError();
    }
    return this._addChatCompletion(__classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_endRequest).call(this));
  }
  async _fromReadableStream(readableStream, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_beginRequest).call(this);
    this._connected();
    const stream = Stream.fromReadableStream(readableStream, this.controller);
    let chatId;
    for await (const chunk of stream) {
      if (chatId && chatId !== chunk.id) {
        this._addChatCompletion(__classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_endRequest).call(this));
      }
      __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_addChunk).call(this, chunk);
      chatId = chunk.id;
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError();
    }
    return this._addChatCompletion(__classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_endRequest).call(this));
  }
  [(_ChatCompletionStream_params = /* @__PURE__ */ new WeakMap(), _ChatCompletionStream_choiceEventStates = /* @__PURE__ */ new WeakMap(), _ChatCompletionStream_currentChatCompletionSnapshot = /* @__PURE__ */ new WeakMap(), _ChatCompletionStream_instances = /* @__PURE__ */ new WeakSet(), _ChatCompletionStream_beginRequest = function _ChatCompletionStream_beginRequest2() {
    if (this.ended)
      return;
    __classPrivateFieldSet(this, _ChatCompletionStream_currentChatCompletionSnapshot, void 0, "f");
  }, _ChatCompletionStream_getChoiceEventState = function _ChatCompletionStream_getChoiceEventState2(choice) {
    let state = __classPrivateFieldGet(this, _ChatCompletionStream_choiceEventStates, "f")[choice.index];
    if (state) {
      return state;
    }
    state = {
      content_done: false,
      refusal_done: false,
      logprobs_content_done: false,
      logprobs_refusal_done: false,
      done_tool_calls: /* @__PURE__ */ new Set(),
      current_tool_call_index: null
    };
    __classPrivateFieldGet(this, _ChatCompletionStream_choiceEventStates, "f")[choice.index] = state;
    return state;
  }, _ChatCompletionStream_addChunk = function _ChatCompletionStream_addChunk2(chunk) {
    if (this.ended)
      return;
    const completion = __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_accumulateChatCompletion).call(this, chunk);
    this._emit("chunk", chunk, completion);
    for (const choice of chunk.choices) {
      const choiceSnapshot = completion.choices[choice.index];
      if (choice.delta.content != null && choiceSnapshot.message?.role === "assistant" && choiceSnapshot.message?.content) {
        this._emit("content", choice.delta.content, choiceSnapshot.message.content);
        this._emit("content.delta", {
          delta: choice.delta.content,
          snapshot: choiceSnapshot.message.content,
          parsed: choiceSnapshot.message.parsed
        });
      }
      if (choice.delta.refusal != null && choiceSnapshot.message?.role === "assistant" && choiceSnapshot.message?.refusal) {
        this._emit("refusal.delta", {
          delta: choice.delta.refusal,
          snapshot: choiceSnapshot.message.refusal
        });
      }
      if (choice.logprobs?.content != null && choiceSnapshot.message?.role === "assistant") {
        this._emit("logprobs.content.delta", {
          content: choice.logprobs?.content,
          snapshot: choiceSnapshot.logprobs?.content ?? []
        });
      }
      if (choice.logprobs?.refusal != null && choiceSnapshot.message?.role === "assistant") {
        this._emit("logprobs.refusal.delta", {
          refusal: choice.logprobs?.refusal,
          snapshot: choiceSnapshot.logprobs?.refusal ?? []
        });
      }
      const state = __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_getChoiceEventState).call(this, choiceSnapshot);
      if (choiceSnapshot.finish_reason) {
        __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_emitContentDoneEvents).call(this, choiceSnapshot);
        if (state.current_tool_call_index != null) {
          __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_emitToolCallDoneEvent).call(this, choiceSnapshot, state.current_tool_call_index);
        }
      }
      for (const toolCall of choice.delta.tool_calls ?? []) {
        if (state.current_tool_call_index !== toolCall.index) {
          __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_emitContentDoneEvents).call(this, choiceSnapshot);
          if (state.current_tool_call_index != null) {
            __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_emitToolCallDoneEvent).call(this, choiceSnapshot, state.current_tool_call_index);
          }
        }
        state.current_tool_call_index = toolCall.index;
      }
      for (const toolCallDelta of choice.delta.tool_calls ?? []) {
        const toolCallSnapshot = choiceSnapshot.message.tool_calls?.[toolCallDelta.index];
        if (!toolCallSnapshot?.type) {
          continue;
        }
        if (toolCallSnapshot?.type === "function") {
          this._emit("tool_calls.function.arguments.delta", {
            name: toolCallSnapshot.function?.name,
            index: toolCallDelta.index,
            arguments: toolCallSnapshot.function.arguments,
            parsed_arguments: toolCallSnapshot.function.parsed_arguments,
            arguments_delta: toolCallDelta.function?.arguments ?? ""
          });
        } else {
          assertNever(toolCallSnapshot?.type);
        }
      }
    }
  }, _ChatCompletionStream_emitToolCallDoneEvent = function _ChatCompletionStream_emitToolCallDoneEvent2(choiceSnapshot, toolCallIndex) {
    const state = __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_getChoiceEventState).call(this, choiceSnapshot);
    if (state.done_tool_calls.has(toolCallIndex)) {
      return;
    }
    const toolCallSnapshot = choiceSnapshot.message.tool_calls?.[toolCallIndex];
    if (!toolCallSnapshot) {
      throw new Error("no tool call snapshot");
    }
    if (!toolCallSnapshot.type) {
      throw new Error("tool call snapshot missing `type`");
    }
    if (toolCallSnapshot.type === "function") {
      const inputTool = __classPrivateFieldGet(this, _ChatCompletionStream_params, "f")?.tools?.find((tool) => isChatCompletionFunctionTool(tool) && tool.function.name === toolCallSnapshot.function.name);
      this._emit("tool_calls.function.arguments.done", {
        name: toolCallSnapshot.function.name,
        index: toolCallIndex,
        arguments: toolCallSnapshot.function.arguments,
        parsed_arguments: isAutoParsableTool(inputTool) ? inputTool.$parseRaw(toolCallSnapshot.function.arguments) : inputTool?.function.strict ? JSON.parse(toolCallSnapshot.function.arguments) : null
      });
    } else {
      assertNever(toolCallSnapshot.type);
    }
  }, _ChatCompletionStream_emitContentDoneEvents = function _ChatCompletionStream_emitContentDoneEvents2(choiceSnapshot) {
    const state = __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_getChoiceEventState).call(this, choiceSnapshot);
    if (choiceSnapshot.message.content && !state.content_done) {
      state.content_done = true;
      const responseFormat = __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_getAutoParseableResponseFormat).call(this);
      this._emit("content.done", {
        content: choiceSnapshot.message.content,
        parsed: responseFormat ? responseFormat.$parseRaw(choiceSnapshot.message.content) : null
      });
    }
    if (choiceSnapshot.message.refusal && !state.refusal_done) {
      state.refusal_done = true;
      this._emit("refusal.done", { refusal: choiceSnapshot.message.refusal });
    }
    if (choiceSnapshot.logprobs?.content && !state.logprobs_content_done) {
      state.logprobs_content_done = true;
      this._emit("logprobs.content.done", { content: choiceSnapshot.logprobs.content });
    }
    if (choiceSnapshot.logprobs?.refusal && !state.logprobs_refusal_done) {
      state.logprobs_refusal_done = true;
      this._emit("logprobs.refusal.done", { refusal: choiceSnapshot.logprobs.refusal });
    }
  }, _ChatCompletionStream_endRequest = function _ChatCompletionStream_endRequest2() {
    if (this.ended) {
      throw new OpenAIError(`stream has ended, this shouldn't happen`);
    }
    const snapshot = __classPrivateFieldGet(this, _ChatCompletionStream_currentChatCompletionSnapshot, "f");
    if (!snapshot) {
      throw new OpenAIError(`request ended without sending any chunks`);
    }
    __classPrivateFieldSet(this, _ChatCompletionStream_currentChatCompletionSnapshot, void 0, "f");
    __classPrivateFieldSet(this, _ChatCompletionStream_choiceEventStates, [], "f");
    return finalizeChatCompletion(snapshot, __classPrivateFieldGet(this, _ChatCompletionStream_params, "f"));
  }, _ChatCompletionStream_getAutoParseableResponseFormat = function _ChatCompletionStream_getAutoParseableResponseFormat2() {
    const responseFormat = __classPrivateFieldGet(this, _ChatCompletionStream_params, "f")?.response_format;
    if (isAutoParsableResponseFormat(responseFormat)) {
      return responseFormat;
    }
    return null;
  }, _ChatCompletionStream_accumulateChatCompletion = function _ChatCompletionStream_accumulateChatCompletion2(chunk) {
    var _a3, _b, _c, _d;
    let snapshot = __classPrivateFieldGet(this, _ChatCompletionStream_currentChatCompletionSnapshot, "f");
    const { choices, ...rest } = chunk;
    if (!snapshot) {
      snapshot = __classPrivateFieldSet(this, _ChatCompletionStream_currentChatCompletionSnapshot, {
        ...rest,
        choices: []
      }, "f");
    } else {
      Object.assign(snapshot, rest);
    }
    for (const { delta, finish_reason, index, logprobs = null, ...other } of chunk.choices) {
      let choice = snapshot.choices[index];
      if (!choice) {
        choice = snapshot.choices[index] = { finish_reason, index, message: {}, logprobs, ...other };
      }
      if (logprobs) {
        if (!choice.logprobs) {
          choice.logprobs = Object.assign({}, logprobs);
        } else {
          const { content: content2, refusal: refusal2, ...rest3 } = logprobs;
          assertIsEmpty(rest3);
          Object.assign(choice.logprobs, rest3);
          if (content2) {
            (_a3 = choice.logprobs).content ?? (_a3.content = []);
            choice.logprobs.content.push(...content2);
          }
          if (refusal2) {
            (_b = choice.logprobs).refusal ?? (_b.refusal = []);
            choice.logprobs.refusal.push(...refusal2);
          }
        }
      }
      if (finish_reason) {
        choice.finish_reason = finish_reason;
        if (__classPrivateFieldGet(this, _ChatCompletionStream_params, "f") && hasAutoParseableInput(__classPrivateFieldGet(this, _ChatCompletionStream_params, "f"))) {
          if (finish_reason === "length") {
            throw new LengthFinishReasonError();
          }
          if (finish_reason === "content_filter") {
            throw new ContentFilterFinishReasonError();
          }
        }
      }
      Object.assign(choice, other);
      if (!delta)
        continue;
      const { content, refusal, function_call, role, tool_calls, ...rest2 } = delta;
      assertIsEmpty(rest2);
      Object.assign(choice.message, rest2);
      if (refusal) {
        choice.message.refusal = (choice.message.refusal || "") + refusal;
      }
      if (role)
        choice.message.role = role;
      if (function_call) {
        if (!choice.message.function_call) {
          choice.message.function_call = function_call;
        } else {
          if (function_call.name)
            choice.message.function_call.name = function_call.name;
          if (function_call.arguments) {
            (_c = choice.message.function_call).arguments ?? (_c.arguments = "");
            choice.message.function_call.arguments += function_call.arguments;
          }
        }
      }
      if (content) {
        choice.message.content = (choice.message.content || "") + content;
        if (!choice.message.refusal && __classPrivateFieldGet(this, _ChatCompletionStream_instances, "m", _ChatCompletionStream_getAutoParseableResponseFormat).call(this)) {
          choice.message.parsed = partialParse(choice.message.content);
        }
      }
      if (tool_calls) {
        if (!choice.message.tool_calls)
          choice.message.tool_calls = [];
        for (const { index: index2, id, type, function: fn, ...rest3 } of tool_calls) {
          const tool_call = (_d = choice.message.tool_calls)[index2] ?? (_d[index2] = {});
          Object.assign(tool_call, rest3);
          if (id)
            tool_call.id = id;
          if (type)
            tool_call.type = type;
          if (fn)
            tool_call.function ?? (tool_call.function = { name: fn.name ?? "", arguments: "" });
          if (fn?.name)
            tool_call.function.name = fn.name;
          if (fn?.arguments) {
            tool_call.function.arguments += fn.arguments;
            if (shouldParseToolCall(__classPrivateFieldGet(this, _ChatCompletionStream_params, "f"), tool_call)) {
              tool_call.function.parsed_arguments = partialParse(tool_call.function.arguments);
            }
          }
        }
      }
    }
    return snapshot;
  }, Symbol.asyncIterator)]() {
    const pushQueue = [];
    const readQueue = [];
    let done = false;
    this.on("chunk", (chunk) => {
      const reader = readQueue.shift();
      if (reader) {
        reader.resolve(chunk);
      } else {
        pushQueue.push(chunk);
      }
    });
    this.on("end", () => {
      done = true;
      for (const reader of readQueue) {
        reader.resolve(void 0);
      }
      readQueue.length = 0;
    });
    this.on("abort", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    this.on("error", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    return {
      next: async () => {
        if (!pushQueue.length) {
          if (done) {
            return { value: void 0, done: true };
          }
          return new Promise((resolve, reject) => readQueue.push({ resolve, reject })).then((chunk2) => chunk2 ? { value: chunk2, done: false } : { value: void 0, done: true });
        }
        const chunk = pushQueue.shift();
        return { value: chunk, done: false };
      },
      return: async () => {
        this.abort();
        return { value: void 0, done: true };
      }
    };
  }
  toReadableStream() {
    const stream = new Stream(this[Symbol.asyncIterator].bind(this), this.controller);
    return stream.toReadableStream();
  }
};
function finalizeChatCompletion(snapshot, params) {
  const { id, choices, created, model, system_fingerprint, ...rest } = snapshot;
  const completion = {
    ...rest,
    id,
    choices: choices.map(({ message, finish_reason, index, logprobs, ...choiceRest }) => {
      if (!finish_reason) {
        throw new OpenAIError(`missing finish_reason for choice ${index}`);
      }
      const { content = null, function_call, tool_calls, ...messageRest } = message;
      const role = message.role;
      if (!role) {
        throw new OpenAIError(`missing role for choice ${index}`);
      }
      if (function_call) {
        const { arguments: args, name } = function_call;
        if (args == null) {
          throw new OpenAIError(`missing function_call.arguments for choice ${index}`);
        }
        if (!name) {
          throw new OpenAIError(`missing function_call.name for choice ${index}`);
        }
        return {
          ...choiceRest,
          message: {
            content,
            function_call: { arguments: args, name },
            role,
            refusal: message.refusal ?? null
          },
          finish_reason,
          index,
          logprobs
        };
      }
      if (tool_calls) {
        return {
          ...choiceRest,
          index,
          finish_reason,
          logprobs,
          message: {
            ...messageRest,
            role,
            content,
            refusal: message.refusal ?? null,
            tool_calls: tool_calls.map((tool_call, i) => {
              const { function: fn, type, id: id2, ...toolRest } = tool_call;
              const { arguments: args, name, ...fnRest } = fn || {};
              if (id2 == null) {
                throw new OpenAIError(`missing choices[${index}].tool_calls[${i}].id
${str(snapshot)}`);
              }
              if (type == null) {
                throw new OpenAIError(`missing choices[${index}].tool_calls[${i}].type
${str(snapshot)}`);
              }
              if (name == null) {
                throw new OpenAIError(`missing choices[${index}].tool_calls[${i}].function.name
${str(snapshot)}`);
              }
              if (args == null) {
                throw new OpenAIError(`missing choices[${index}].tool_calls[${i}].function.arguments
${str(snapshot)}`);
              }
              return { ...toolRest, id: id2, type, function: { ...fnRest, name, arguments: args } };
            })
          }
        };
      }
      return {
        ...choiceRest,
        message: { ...messageRest, content, role, refusal: message.refusal ?? null },
        finish_reason,
        index,
        logprobs
      };
    }),
    created,
    model,
    object: "chat.completion",
    ...system_fingerprint ? { system_fingerprint } : {}
  };
  return maybeParseChatCompletion(completion, params);
}
function str(x) {
  return JSON.stringify(x);
}
function assertIsEmpty(obj) {
  return;
}
function assertNever(_x) {
}

// node_modules/openai/lib/ChatCompletionStreamingRunner.mjs
var ChatCompletionStreamingRunner = class _ChatCompletionStreamingRunner extends ChatCompletionStream {
  static fromReadableStream(stream) {
    const runner = new _ChatCompletionStreamingRunner(null);
    runner._run(() => runner._fromReadableStream(stream));
    return runner;
  }
  static runTools(client, params, options) {
    const runner = new _ChatCompletionStreamingRunner(
      // @ts-expect-error TODO these types are incompatible
      params
    );
    const opts = {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "runTools" }
    };
    runner._run(() => runner._runTools(client, params, opts));
    return runner;
  }
};

// node_modules/openai/resources/chat/completions/completions.mjs
var Completions = class extends APIResource {
  constructor() {
    super(...arguments);
    this.messages = new Messages(this._client);
  }
  create(body, options) {
    return this._client.post("/chat/completions", { body, ...options, stream: body.stream ?? false });
  }
  /**
   * Get a stored chat completion. Only Chat Completions that have been created with
   * the `store` parameter set to `true` will be returned.
   *
   * @example
   * ```ts
   * const chatCompletion =
   *   await client.chat.completions.retrieve('completion_id');
   * ```
   */
  retrieve(completionID, options) {
    return this._client.get(path`/chat/completions/${completionID}`, options);
  }
  /**
   * Modify a stored chat completion. Only Chat Completions that have been created
   * with the `store` parameter set to `true` can be modified. Currently, the only
   * supported modification is to update the `metadata` field.
   *
   * @example
   * ```ts
   * const chatCompletion = await client.chat.completions.update(
   *   'completion_id',
   *   { metadata: { foo: 'string' } },
   * );
   * ```
   */
  update(completionID, body, options) {
    return this._client.post(path`/chat/completions/${completionID}`, { body, ...options });
  }
  /**
   * List stored Chat Completions. Only Chat Completions that have been stored with
   * the `store` parameter set to `true` will be returned.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const chatCompletion of client.chat.completions.list()) {
   *   // ...
   * }
   * ```
   */
  list(query = {}, options) {
    return this._client.getAPIList("/chat/completions", CursorPage, { query, ...options });
  }
  /**
   * Delete a stored chat completion. Only Chat Completions that have been created
   * with the `store` parameter set to `true` can be deleted.
   *
   * @example
   * ```ts
   * const chatCompletionDeleted =
   *   await client.chat.completions.delete('completion_id');
   * ```
   */
  delete(completionID, options) {
    return this._client.delete(path`/chat/completions/${completionID}`, options);
  }
  parse(body, options) {
    validateInputTools(body.tools);
    return this._client.chat.completions.create(body, {
      ...options,
      headers: {
        ...options?.headers,
        "X-Stainless-Helper-Method": "chat.completions.parse"
      }
    })._thenUnwrap((completion) => parseChatCompletion(completion, body));
  }
  runTools(body, options) {
    if (body.stream) {
      return ChatCompletionStreamingRunner.runTools(this._client, body, options);
    }
    return ChatCompletionRunner.runTools(this._client, body, options);
  }
  /**
   * Creates a chat completion stream
   */
  stream(body, options) {
    return ChatCompletionStream.createChatCompletion(this._client, body, options);
  }
};
Completions.Messages = Messages;

// node_modules/openai/resources/chat/chat.mjs
var Chat = class extends APIResource {
  constructor() {
    super(...arguments);
    this.completions = new Completions(this._client);
  }
};
Chat.Completions = Completions;

// node_modules/openai/internal/headers.mjs
var brand_privateNullableHeaders = /* @__PURE__ */ Symbol("brand.privateNullableHeaders");
function* iterateHeaders(headers) {
  if (!headers)
    return;
  if (brand_privateNullableHeaders in headers) {
    const { values, nulls } = headers;
    yield* values.entries();
    for (const name of nulls) {
      yield [name, null];
    }
    return;
  }
  let shouldClear = false;
  let iter;
  if (headers instanceof Headers) {
    iter = headers.entries();
  } else if (isReadonlyArray(headers)) {
    iter = headers;
  } else {
    shouldClear = true;
    iter = Object.entries(headers ?? {});
  }
  for (let row of iter) {
    const name = row[0];
    if (typeof name !== "string")
      throw new TypeError("expected header name to be a string");
    const values = isReadonlyArray(row[1]) ? row[1] : [row[1]];
    let didClear = false;
    for (const value of values) {
      if (value === void 0)
        continue;
      if (shouldClear && !didClear) {
        didClear = true;
        yield [name, null];
      }
      yield [name, value];
    }
  }
}
var buildHeaders = (newHeaders) => {
  const targetHeaders = new Headers();
  const nullHeaders = /* @__PURE__ */ new Set();
  for (const headers of newHeaders) {
    const seenHeaders = /* @__PURE__ */ new Set();
    for (const [name, value] of iterateHeaders(headers)) {
      const lowerName = name.toLowerCase();
      if (!seenHeaders.has(lowerName)) {
        targetHeaders.delete(name);
        seenHeaders.add(lowerName);
      }
      if (value === null) {
        targetHeaders.delete(name);
        nullHeaders.add(lowerName);
      } else {
        targetHeaders.append(name, value);
        nullHeaders.delete(lowerName);
      }
    }
  }
  return { [brand_privateNullableHeaders]: true, values: targetHeaders, nulls: nullHeaders };
};

// node_modules/openai/resources/audio/speech.mjs
var Speech = class extends APIResource {
  /**
   * Generates audio from the input text.
   *
   * @example
   * ```ts
   * const speech = await client.audio.speech.create({
   *   input: 'input',
   *   model: 'string',
   *   voice: 'ash',
   * });
   *
   * const content = await speech.blob();
   * console.log(content);
   * ```
   */
  create(body, options) {
    return this._client.post("/audio/speech", {
      body,
      ...options,
      headers: buildHeaders([{ Accept: "application/octet-stream" }, options?.headers]),
      __binaryResponse: true
    });
  }
};

// node_modules/openai/resources/audio/transcriptions.mjs
var Transcriptions = class extends APIResource {
  create(body, options) {
    return this._client.post("/audio/transcriptions", multipartFormRequestOptions({
      body,
      ...options,
      stream: body.stream ?? false,
      __metadata: { model: body.model }
    }, this._client));
  }
};

// node_modules/openai/resources/audio/translations.mjs
var Translations = class extends APIResource {
  create(body, options) {
    return this._client.post("/audio/translations", multipartFormRequestOptions({ body, ...options, __metadata: { model: body.model } }, this._client));
  }
};

// node_modules/openai/resources/audio/audio.mjs
var Audio = class extends APIResource {
  constructor() {
    super(...arguments);
    this.transcriptions = new Transcriptions(this._client);
    this.translations = new Translations(this._client);
    this.speech = new Speech(this._client);
  }
};
Audio.Transcriptions = Transcriptions;
Audio.Translations = Translations;
Audio.Speech = Speech;

// node_modules/openai/resources/batches.mjs
var Batches = class extends APIResource {
  /**
   * Creates and executes a batch from an uploaded file of requests
   */
  create(body, options) {
    return this._client.post("/batches", { body, ...options });
  }
  /**
   * Retrieves a batch.
   */
  retrieve(batchID, options) {
    return this._client.get(path`/batches/${batchID}`, options);
  }
  /**
   * List your organization's batches.
   */
  list(query = {}, options) {
    return this._client.getAPIList("/batches", CursorPage, { query, ...options });
  }
  /**
   * Cancels an in-progress batch. The batch will be in status `cancelling` for up to
   * 10 minutes, before changing to `cancelled`, where it will have partial results
   * (if any) available in the output file.
   */
  cancel(batchID, options) {
    return this._client.post(path`/batches/${batchID}/cancel`, options);
  }
};

// node_modules/openai/resources/beta/assistants.mjs
var Assistants = class extends APIResource {
  /**
   * Create an assistant with a model and instructions.
   *
   * @example
   * ```ts
   * const assistant = await client.beta.assistants.create({
   *   model: 'gpt-4o',
   * });
   * ```
   */
  create(body, options) {
    return this._client.post("/assistants", {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Retrieves an assistant.
   *
   * @example
   * ```ts
   * const assistant = await client.beta.assistants.retrieve(
   *   'assistant_id',
   * );
   * ```
   */
  retrieve(assistantID, options) {
    return this._client.get(path`/assistants/${assistantID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Modifies an assistant.
   *
   * @example
   * ```ts
   * const assistant = await client.beta.assistants.update(
   *   'assistant_id',
   * );
   * ```
   */
  update(assistantID, body, options) {
    return this._client.post(path`/assistants/${assistantID}`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Returns a list of assistants.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const assistant of client.beta.assistants.list()) {
   *   // ...
   * }
   * ```
   */
  list(query = {}, options) {
    return this._client.getAPIList("/assistants", CursorPage, {
      query,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Delete an assistant.
   *
   * @example
   * ```ts
   * const assistantDeleted =
   *   await client.beta.assistants.delete('assistant_id');
   * ```
   */
  delete(assistantID, options) {
    return this._client.delete(path`/assistants/${assistantID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
};

// node_modules/openai/resources/beta/realtime/sessions.mjs
var Sessions = class extends APIResource {
  /**
   * Create an ephemeral API token for use in client-side applications with the
   * Realtime API. Can be configured with the same session parameters as the
   * `session.update` client event.
   *
   * It responds with a session object, plus a `client_secret` key which contains a
   * usable ephemeral API token that can be used to authenticate browser clients for
   * the Realtime API.
   *
   * @example
   * ```ts
   * const session =
   *   await client.beta.realtime.sessions.create();
   * ```
   */
  create(body, options) {
    return this._client.post("/realtime/sessions", {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
};

// node_modules/openai/resources/beta/realtime/transcription-sessions.mjs
var TranscriptionSessions = class extends APIResource {
  /**
   * Create an ephemeral API token for use in client-side applications with the
   * Realtime API specifically for realtime transcriptions. Can be configured with
   * the same session parameters as the `transcription_session.update` client event.
   *
   * It responds with a session object, plus a `client_secret` key which contains a
   * usable ephemeral API token that can be used to authenticate browser clients for
   * the Realtime API.
   *
   * @example
   * ```ts
   * const transcriptionSession =
   *   await client.beta.realtime.transcriptionSessions.create();
   * ```
   */
  create(body, options) {
    return this._client.post("/realtime/transcription_sessions", {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
};

// node_modules/openai/resources/beta/realtime/realtime.mjs
var Realtime = class extends APIResource {
  constructor() {
    super(...arguments);
    this.sessions = new Sessions(this._client);
    this.transcriptionSessions = new TranscriptionSessions(this._client);
  }
};
Realtime.Sessions = Sessions;
Realtime.TranscriptionSessions = TranscriptionSessions;

// node_modules/openai/resources/beta/chatkit/sessions.mjs
var Sessions2 = class extends APIResource {
  /**
   * Create a ChatKit session
   *
   * @example
   * ```ts
   * const chatSession =
   *   await client.beta.chatkit.sessions.create({
   *     user: 'x',
   *     workflow: { id: 'id' },
   *   });
   * ```
   */
  create(body, options) {
    return this._client.post("/chatkit/sessions", {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "chatkit_beta=v1" }, options?.headers])
    });
  }
  /**
   * Cancel a ChatKit session
   *
   * @example
   * ```ts
   * const chatSession =
   *   await client.beta.chatkit.sessions.cancel('cksess_123');
   * ```
   */
  cancel(sessionID, options) {
    return this._client.post(path`/chatkit/sessions/${sessionID}/cancel`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "chatkit_beta=v1" }, options?.headers])
    });
  }
};

// node_modules/openai/resources/beta/chatkit/threads.mjs
var Threads = class extends APIResource {
  /**
   * Retrieve a ChatKit thread
   *
   * @example
   * ```ts
   * const chatkitThread =
   *   await client.beta.chatkit.threads.retrieve('cthr_123');
   * ```
   */
  retrieve(threadID, options) {
    return this._client.get(path`/chatkit/threads/${threadID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "chatkit_beta=v1" }, options?.headers])
    });
  }
  /**
   * List ChatKit threads
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const chatkitThread of client.beta.chatkit.threads.list()) {
   *   // ...
   * }
   * ```
   */
  list(query = {}, options) {
    return this._client.getAPIList("/chatkit/threads", ConversationCursorPage, {
      query,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "chatkit_beta=v1" }, options?.headers])
    });
  }
  /**
   * Delete a ChatKit thread
   *
   * @example
   * ```ts
   * const thread = await client.beta.chatkit.threads.delete(
   *   'cthr_123',
   * );
   * ```
   */
  delete(threadID, options) {
    return this._client.delete(path`/chatkit/threads/${threadID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "chatkit_beta=v1" }, options?.headers])
    });
  }
  /**
   * List ChatKit thread items
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const thread of client.beta.chatkit.threads.listItems(
   *   'cthr_123',
   * )) {
   *   // ...
   * }
   * ```
   */
  listItems(threadID, query = {}, options) {
    return this._client.getAPIList(path`/chatkit/threads/${threadID}/items`, ConversationCursorPage, { query, ...options, headers: buildHeaders([{ "OpenAI-Beta": "chatkit_beta=v1" }, options?.headers]) });
  }
};

// node_modules/openai/resources/beta/chatkit/chatkit.mjs
var ChatKit = class extends APIResource {
  constructor() {
    super(...arguments);
    this.sessions = new Sessions2(this._client);
    this.threads = new Threads(this._client);
  }
};
ChatKit.Sessions = Sessions2;
ChatKit.Threads = Threads;

// node_modules/openai/resources/beta/threads/messages.mjs
var Messages2 = class extends APIResource {
  /**
   * Create a message.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  create(threadID, body, options) {
    return this._client.post(path`/threads/${threadID}/messages`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Retrieve a message.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  retrieve(messageID, params, options) {
    const { thread_id } = params;
    return this._client.get(path`/threads/${thread_id}/messages/${messageID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Modifies a message.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  update(messageID, params, options) {
    const { thread_id, ...body } = params;
    return this._client.post(path`/threads/${thread_id}/messages/${messageID}`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Returns a list of messages for a given thread.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  list(threadID, query = {}, options) {
    return this._client.getAPIList(path`/threads/${threadID}/messages`, CursorPage, {
      query,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Deletes a message.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  delete(messageID, params, options) {
    const { thread_id } = params;
    return this._client.delete(path`/threads/${thread_id}/messages/${messageID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
};

// node_modules/openai/resources/beta/threads/runs/steps.mjs
var Steps = class extends APIResource {
  /**
   * Retrieves a run step.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  retrieve(stepID, params, options) {
    const { thread_id, run_id, ...query } = params;
    return this._client.get(path`/threads/${thread_id}/runs/${run_id}/steps/${stepID}`, {
      query,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Returns a list of run steps belonging to a run.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  list(runID, params, options) {
    const { thread_id, ...query } = params;
    return this._client.getAPIList(path`/threads/${thread_id}/runs/${runID}/steps`, CursorPage, {
      query,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
};

// node_modules/openai/internal/utils/base64.mjs
var toFloat32Array = (base64Str) => {
  if (typeof Buffer !== "undefined") {
    const buf = Buffer.from(base64Str, "base64");
    return Array.from(new Float32Array(buf.buffer, buf.byteOffset, buf.length / Float32Array.BYTES_PER_ELEMENT));
  } else {
    const binaryStr = atob(base64Str);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return Array.from(new Float32Array(bytes.buffer));
  }
};

// node_modules/openai/internal/utils/env.mjs
var readEnv = (env) => {
  if (typeof globalThis.process !== "undefined") {
    return globalThis.process.env?.[env]?.trim() ?? void 0;
  }
  if (typeof globalThis.Deno !== "undefined") {
    return globalThis.Deno.env?.get?.(env)?.trim();
  }
  return void 0;
};

// node_modules/openai/lib/AssistantStream.mjs
var _AssistantStream_instances;
var _a;
var _AssistantStream_events;
var _AssistantStream_runStepSnapshots;
var _AssistantStream_messageSnapshots;
var _AssistantStream_messageSnapshot;
var _AssistantStream_finalRun;
var _AssistantStream_currentContentIndex;
var _AssistantStream_currentContent;
var _AssistantStream_currentToolCallIndex;
var _AssistantStream_currentToolCall;
var _AssistantStream_currentEvent;
var _AssistantStream_currentRunSnapshot;
var _AssistantStream_currentRunStepSnapshot;
var _AssistantStream_addEvent;
var _AssistantStream_endRequest;
var _AssistantStream_handleMessage;
var _AssistantStream_handleRunStep;
var _AssistantStream_handleEvent;
var _AssistantStream_accumulateRunStep;
var _AssistantStream_accumulateMessage;
var _AssistantStream_accumulateContent;
var _AssistantStream_handleRun;
var AssistantStream = class extends EventStream {
  constructor() {
    super(...arguments);
    _AssistantStream_instances.add(this);
    _AssistantStream_events.set(this, []);
    _AssistantStream_runStepSnapshots.set(this, {});
    _AssistantStream_messageSnapshots.set(this, {});
    _AssistantStream_messageSnapshot.set(this, void 0);
    _AssistantStream_finalRun.set(this, void 0);
    _AssistantStream_currentContentIndex.set(this, void 0);
    _AssistantStream_currentContent.set(this, void 0);
    _AssistantStream_currentToolCallIndex.set(this, void 0);
    _AssistantStream_currentToolCall.set(this, void 0);
    _AssistantStream_currentEvent.set(this, void 0);
    _AssistantStream_currentRunSnapshot.set(this, void 0);
    _AssistantStream_currentRunStepSnapshot.set(this, void 0);
  }
  [(_AssistantStream_events = /* @__PURE__ */ new WeakMap(), _AssistantStream_runStepSnapshots = /* @__PURE__ */ new WeakMap(), _AssistantStream_messageSnapshots = /* @__PURE__ */ new WeakMap(), _AssistantStream_messageSnapshot = /* @__PURE__ */ new WeakMap(), _AssistantStream_finalRun = /* @__PURE__ */ new WeakMap(), _AssistantStream_currentContentIndex = /* @__PURE__ */ new WeakMap(), _AssistantStream_currentContent = /* @__PURE__ */ new WeakMap(), _AssistantStream_currentToolCallIndex = /* @__PURE__ */ new WeakMap(), _AssistantStream_currentToolCall = /* @__PURE__ */ new WeakMap(), _AssistantStream_currentEvent = /* @__PURE__ */ new WeakMap(), _AssistantStream_currentRunSnapshot = /* @__PURE__ */ new WeakMap(), _AssistantStream_currentRunStepSnapshot = /* @__PURE__ */ new WeakMap(), _AssistantStream_instances = /* @__PURE__ */ new WeakSet(), Symbol.asyncIterator)]() {
    const pushQueue = [];
    const readQueue = [];
    let done = false;
    this.on("event", (event) => {
      const reader = readQueue.shift();
      if (reader) {
        reader.resolve(event);
      } else {
        pushQueue.push(event);
      }
    });
    this.on("end", () => {
      done = true;
      for (const reader of readQueue) {
        reader.resolve(void 0);
      }
      readQueue.length = 0;
    });
    this.on("abort", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    this.on("error", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    return {
      next: async () => {
        if (!pushQueue.length) {
          if (done) {
            return { value: void 0, done: true };
          }
          return new Promise((resolve, reject) => readQueue.push({ resolve, reject })).then((chunk2) => chunk2 ? { value: chunk2, done: false } : { value: void 0, done: true });
        }
        const chunk = pushQueue.shift();
        return { value: chunk, done: false };
      },
      return: async () => {
        this.abort();
        return { value: void 0, done: true };
      }
    };
  }
  static fromReadableStream(stream) {
    const runner = new _a();
    runner._run(() => runner._fromReadableStream(stream));
    return runner;
  }
  async _fromReadableStream(readableStream, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    this._connected();
    const stream = Stream.fromReadableStream(readableStream, this.controller);
    for await (const event of stream) {
      __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_addEvent).call(this, event);
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError();
    }
    return this._addRun(__classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_endRequest).call(this));
  }
  toReadableStream() {
    const stream = new Stream(this[Symbol.asyncIterator].bind(this), this.controller);
    return stream.toReadableStream();
  }
  static createToolAssistantStream(runId, runs, params, options) {
    const runner = new _a();
    runner._run(() => runner._runToolAssistantStream(runId, runs, params, {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "stream" }
    }));
    return runner;
  }
  async _createToolAssistantStream(run, runId, params, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    const body = { ...params, stream: true };
    const stream = await run.submitToolOutputs(runId, body, {
      ...options,
      signal: this.controller.signal
    });
    this._connected();
    for await (const event of stream) {
      __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_addEvent).call(this, event);
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError();
    }
    return this._addRun(__classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_endRequest).call(this));
  }
  static createThreadAssistantStream(params, thread, options) {
    const runner = new _a();
    runner._run(() => runner._threadAssistantStream(params, thread, {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "stream" }
    }));
    return runner;
  }
  static createAssistantStream(threadId, runs, params, options) {
    const runner = new _a();
    runner._run(() => runner._runAssistantStream(threadId, runs, params, {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "stream" }
    }));
    return runner;
  }
  currentEvent() {
    return __classPrivateFieldGet(this, _AssistantStream_currentEvent, "f");
  }
  currentRun() {
    return __classPrivateFieldGet(this, _AssistantStream_currentRunSnapshot, "f");
  }
  currentMessageSnapshot() {
    return __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f");
  }
  currentRunStepSnapshot() {
    return __classPrivateFieldGet(this, _AssistantStream_currentRunStepSnapshot, "f");
  }
  async finalRunSteps() {
    await this.done();
    return Object.values(__classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f"));
  }
  async finalMessages() {
    await this.done();
    return Object.values(__classPrivateFieldGet(this, _AssistantStream_messageSnapshots, "f"));
  }
  async finalRun() {
    await this.done();
    if (!__classPrivateFieldGet(this, _AssistantStream_finalRun, "f"))
      throw Error("Final run was not received.");
    return __classPrivateFieldGet(this, _AssistantStream_finalRun, "f");
  }
  async _createThreadAssistantStream(thread, params, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    const body = { ...params, stream: true };
    const stream = await thread.createAndRun(body, { ...options, signal: this.controller.signal });
    this._connected();
    for await (const event of stream) {
      __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_addEvent).call(this, event);
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError();
    }
    return this._addRun(__classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_endRequest).call(this));
  }
  async _createAssistantStream(run, threadId, params, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    const body = { ...params, stream: true };
    const stream = await run.create(threadId, body, { ...options, signal: this.controller.signal });
    this._connected();
    for await (const event of stream) {
      __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_addEvent).call(this, event);
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError();
    }
    return this._addRun(__classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_endRequest).call(this));
  }
  static accumulateDelta(acc, delta) {
    for (const [key, deltaValue] of Object.entries(delta)) {
      if (!acc.hasOwnProperty(key)) {
        acc[key] = deltaValue;
        continue;
      }
      let accValue = acc[key];
      if (accValue === null || accValue === void 0) {
        acc[key] = deltaValue;
        continue;
      }
      if (key === "index" || key === "type") {
        acc[key] = deltaValue;
        continue;
      }
      if (typeof accValue === "string" && typeof deltaValue === "string") {
        accValue += deltaValue;
      } else if (typeof accValue === "number" && typeof deltaValue === "number") {
        accValue += deltaValue;
      } else if (isObj(accValue) && isObj(deltaValue)) {
        accValue = this.accumulateDelta(accValue, deltaValue);
      } else if (Array.isArray(accValue) && Array.isArray(deltaValue)) {
        if (accValue.every((x) => typeof x === "string" || typeof x === "number")) {
          accValue.push(...deltaValue);
          continue;
        }
        for (const deltaEntry of deltaValue) {
          if (!isObj(deltaEntry)) {
            throw new Error(`Expected array delta entry to be an object but got: ${deltaEntry}`);
          }
          const index = deltaEntry["index"];
          if (index == null) {
            console.error(deltaEntry);
            throw new Error("Expected array delta entry to have an `index` property");
          }
          if (typeof index !== "number") {
            throw new Error(`Expected array delta entry \`index\` property to be a number but got ${index}`);
          }
          const accEntry = accValue[index];
          if (accEntry == null) {
            accValue.push(deltaEntry);
          } else {
            accValue[index] = this.accumulateDelta(accEntry, deltaEntry);
          }
        }
        continue;
      } else {
        throw Error(`Unhandled record type: ${key}, deltaValue: ${deltaValue}, accValue: ${accValue}`);
      }
      acc[key] = accValue;
    }
    return acc;
  }
  _addRun(run) {
    return run;
  }
  async _threadAssistantStream(params, thread, options) {
    return await this._createThreadAssistantStream(thread, params, options);
  }
  async _runAssistantStream(threadId, runs, params, options) {
    return await this._createAssistantStream(runs, threadId, params, options);
  }
  async _runToolAssistantStream(runId, runs, params, options) {
    return await this._createToolAssistantStream(runs, runId, params, options);
  }
};
_a = AssistantStream, _AssistantStream_addEvent = function _AssistantStream_addEvent2(event) {
  if (this.ended)
    return;
  __classPrivateFieldSet(this, _AssistantStream_currentEvent, event, "f");
  __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_handleEvent).call(this, event);
  switch (event.event) {
    case "thread.created":
      break;
    case "thread.run.created":
    case "thread.run.queued":
    case "thread.run.in_progress":
    case "thread.run.requires_action":
    case "thread.run.completed":
    case "thread.run.incomplete":
    case "thread.run.failed":
    case "thread.run.cancelling":
    case "thread.run.cancelled":
    case "thread.run.expired":
      __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_handleRun).call(this, event);
      break;
    case "thread.run.step.created":
    case "thread.run.step.in_progress":
    case "thread.run.step.delta":
    case "thread.run.step.completed":
    case "thread.run.step.failed":
    case "thread.run.step.cancelled":
    case "thread.run.step.expired":
      __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_handleRunStep).call(this, event);
      break;
    case "thread.message.created":
    case "thread.message.in_progress":
    case "thread.message.delta":
    case "thread.message.completed":
    case "thread.message.incomplete":
      __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_handleMessage).call(this, event);
      break;
    case "error":
      throw new Error("Encountered an error event in event processing - errors should be processed earlier");
    default:
      assertNever2(event);
  }
}, _AssistantStream_endRequest = function _AssistantStream_endRequest2() {
  if (this.ended) {
    throw new OpenAIError(`stream has ended, this shouldn't happen`);
  }
  if (!__classPrivateFieldGet(this, _AssistantStream_finalRun, "f"))
    throw Error("Final run has not been received");
  return __classPrivateFieldGet(this, _AssistantStream_finalRun, "f");
}, _AssistantStream_handleMessage = function _AssistantStream_handleMessage2(event) {
  const [accumulatedMessage, newContent] = __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_accumulateMessage).call(this, event, __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f"));
  __classPrivateFieldSet(this, _AssistantStream_messageSnapshot, accumulatedMessage, "f");
  __classPrivateFieldGet(this, _AssistantStream_messageSnapshots, "f")[accumulatedMessage.id] = accumulatedMessage;
  for (const content of newContent) {
    const snapshotContent = accumulatedMessage.content[content.index];
    if (snapshotContent?.type == "text") {
      this._emit("textCreated", snapshotContent.text);
    }
  }
  switch (event.event) {
    case "thread.message.created":
      this._emit("messageCreated", event.data);
      break;
    case "thread.message.in_progress":
      break;
    case "thread.message.delta":
      this._emit("messageDelta", event.data.delta, accumulatedMessage);
      if (event.data.delta.content) {
        for (const content of event.data.delta.content) {
          if (content.type == "text" && content.text) {
            let textDelta = content.text;
            let snapshot = accumulatedMessage.content[content.index];
            if (snapshot && snapshot.type == "text") {
              this._emit("textDelta", textDelta, snapshot.text);
            } else {
              throw Error("The snapshot associated with this text delta is not text or missing");
            }
          }
          if (content.index != __classPrivateFieldGet(this, _AssistantStream_currentContentIndex, "f")) {
            if (__classPrivateFieldGet(this, _AssistantStream_currentContent, "f")) {
              switch (__classPrivateFieldGet(this, _AssistantStream_currentContent, "f").type) {
                case "text":
                  this._emit("textDone", __classPrivateFieldGet(this, _AssistantStream_currentContent, "f").text, __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f"));
                  break;
                case "image_file":
                  this._emit("imageFileDone", __classPrivateFieldGet(this, _AssistantStream_currentContent, "f").image_file, __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f"));
                  break;
              }
            }
            __classPrivateFieldSet(this, _AssistantStream_currentContentIndex, content.index, "f");
          }
          __classPrivateFieldSet(this, _AssistantStream_currentContent, accumulatedMessage.content[content.index], "f");
        }
      }
      break;
    case "thread.message.completed":
    case "thread.message.incomplete":
      if (__classPrivateFieldGet(this, _AssistantStream_currentContentIndex, "f") !== void 0) {
        const currentContent = event.data.content[__classPrivateFieldGet(this, _AssistantStream_currentContentIndex, "f")];
        if (currentContent) {
          switch (currentContent.type) {
            case "image_file":
              this._emit("imageFileDone", currentContent.image_file, __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f"));
              break;
            case "text":
              this._emit("textDone", currentContent.text, __classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f"));
              break;
          }
        }
      }
      if (__classPrivateFieldGet(this, _AssistantStream_messageSnapshot, "f")) {
        this._emit("messageDone", event.data);
      }
      __classPrivateFieldSet(this, _AssistantStream_messageSnapshot, void 0, "f");
  }
}, _AssistantStream_handleRunStep = function _AssistantStream_handleRunStep2(event) {
  const accumulatedRunStep = __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_accumulateRunStep).call(this, event);
  __classPrivateFieldSet(this, _AssistantStream_currentRunStepSnapshot, accumulatedRunStep, "f");
  switch (event.event) {
    case "thread.run.step.created":
      this._emit("runStepCreated", event.data);
      break;
    case "thread.run.step.delta":
      const delta = event.data.delta;
      if (delta.step_details && delta.step_details.type == "tool_calls" && delta.step_details.tool_calls && accumulatedRunStep.step_details.type == "tool_calls") {
        for (const toolCall of delta.step_details.tool_calls) {
          if (toolCall.index == __classPrivateFieldGet(this, _AssistantStream_currentToolCallIndex, "f")) {
            this._emit("toolCallDelta", toolCall, accumulatedRunStep.step_details.tool_calls[toolCall.index]);
          } else {
            if (__classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f")) {
              this._emit("toolCallDone", __classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f"));
            }
            __classPrivateFieldSet(this, _AssistantStream_currentToolCallIndex, toolCall.index, "f");
            __classPrivateFieldSet(this, _AssistantStream_currentToolCall, accumulatedRunStep.step_details.tool_calls[toolCall.index], "f");
            if (__classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f"))
              this._emit("toolCallCreated", __classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f"));
          }
        }
      }
      this._emit("runStepDelta", event.data.delta, accumulatedRunStep);
      break;
    case "thread.run.step.completed":
    case "thread.run.step.failed":
    case "thread.run.step.cancelled":
    case "thread.run.step.expired":
      __classPrivateFieldSet(this, _AssistantStream_currentRunStepSnapshot, void 0, "f");
      const details = event.data.step_details;
      if (details.type == "tool_calls") {
        if (__classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f")) {
          this._emit("toolCallDone", __classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f"));
          __classPrivateFieldSet(this, _AssistantStream_currentToolCall, void 0, "f");
        }
      }
      this._emit("runStepDone", event.data, accumulatedRunStep);
      break;
    case "thread.run.step.in_progress":
      break;
  }
}, _AssistantStream_handleEvent = function _AssistantStream_handleEvent2(event) {
  __classPrivateFieldGet(this, _AssistantStream_events, "f").push(event);
  this._emit("event", event);
}, _AssistantStream_accumulateRunStep = function _AssistantStream_accumulateRunStep2(event) {
  switch (event.event) {
    case "thread.run.step.created":
      __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id] = event.data;
      return event.data;
    case "thread.run.step.delta":
      let snapshot = __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id];
      if (!snapshot) {
        throw Error("Received a RunStepDelta before creation of a snapshot");
      }
      let data = event.data;
      if (data.delta) {
        const accumulated = _a.accumulateDelta(snapshot, data.delta);
        __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id] = accumulated;
      }
      return __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id];
    case "thread.run.step.completed":
    case "thread.run.step.failed":
    case "thread.run.step.cancelled":
    case "thread.run.step.expired":
    case "thread.run.step.in_progress":
      __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id] = event.data;
      break;
  }
  if (__classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id])
    return __classPrivateFieldGet(this, _AssistantStream_runStepSnapshots, "f")[event.data.id];
  throw new Error("No snapshot available");
}, _AssistantStream_accumulateMessage = function _AssistantStream_accumulateMessage2(event, snapshot) {
  let newContent = [];
  switch (event.event) {
    case "thread.message.created":
      return [event.data, newContent];
    case "thread.message.delta":
      if (!snapshot) {
        throw Error("Received a delta with no existing snapshot (there should be one from message creation)");
      }
      let data = event.data;
      if (data.delta.content) {
        for (const contentElement of data.delta.content) {
          if (contentElement.index in snapshot.content) {
            let currentContent = snapshot.content[contentElement.index];
            snapshot.content[contentElement.index] = __classPrivateFieldGet(this, _AssistantStream_instances, "m", _AssistantStream_accumulateContent).call(this, contentElement, currentContent);
          } else {
            snapshot.content[contentElement.index] = contentElement;
            newContent.push(contentElement);
          }
        }
      }
      return [snapshot, newContent];
    case "thread.message.in_progress":
    case "thread.message.completed":
    case "thread.message.incomplete":
      if (snapshot) {
        return [snapshot, newContent];
      } else {
        throw Error("Received thread message event with no existing snapshot");
      }
  }
  throw Error("Tried to accumulate a non-message event");
}, _AssistantStream_accumulateContent = function _AssistantStream_accumulateContent2(contentElement, currentContent) {
  return _a.accumulateDelta(currentContent, contentElement);
}, _AssistantStream_handleRun = function _AssistantStream_handleRun2(event) {
  __classPrivateFieldSet(this, _AssistantStream_currentRunSnapshot, event.data, "f");
  switch (event.event) {
    case "thread.run.created":
      break;
    case "thread.run.queued":
      break;
    case "thread.run.in_progress":
      break;
    case "thread.run.requires_action":
    case "thread.run.cancelled":
    case "thread.run.failed":
    case "thread.run.completed":
    case "thread.run.expired":
    case "thread.run.incomplete":
      __classPrivateFieldSet(this, _AssistantStream_finalRun, event.data, "f");
      if (__classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f")) {
        this._emit("toolCallDone", __classPrivateFieldGet(this, _AssistantStream_currentToolCall, "f"));
        __classPrivateFieldSet(this, _AssistantStream_currentToolCall, void 0, "f");
      }
      break;
    case "thread.run.cancelling":
      break;
  }
};
function assertNever2(_x) {
}

// node_modules/openai/resources/beta/threads/runs/runs.mjs
var Runs = class extends APIResource {
  constructor() {
    super(...arguments);
    this.steps = new Steps(this._client);
  }
  create(threadID, params, options) {
    const { include, ...body } = params;
    return this._client.post(path`/threads/${threadID}/runs`, {
      query: { include },
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers]),
      stream: params.stream ?? false
    });
  }
  /**
   * Retrieves a run.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  retrieve(runID, params, options) {
    const { thread_id } = params;
    return this._client.get(path`/threads/${thread_id}/runs/${runID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Modifies a run.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  update(runID, params, options) {
    const { thread_id, ...body } = params;
    return this._client.post(path`/threads/${thread_id}/runs/${runID}`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Returns a list of runs belonging to a thread.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  list(threadID, query = {}, options) {
    return this._client.getAPIList(path`/threads/${threadID}/runs`, CursorPage, {
      query,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Cancels a run that is `in_progress`.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  cancel(runID, params, options) {
    const { thread_id } = params;
    return this._client.post(path`/threads/${thread_id}/runs/${runID}/cancel`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * A helper to create a run an poll for a terminal state. More information on Run
   * lifecycles can be found here:
   * https://platform.openai.com/docs/assistants/how-it-works/runs-and-run-steps
   */
  async createAndPoll(threadId, body, options) {
    const run = await this.create(threadId, body, options);
    return await this.poll(run.id, { thread_id: threadId }, options);
  }
  /**
   * Create a Run stream
   *
   * @deprecated use `stream` instead
   */
  createAndStream(threadId, body, options) {
    return AssistantStream.createAssistantStream(threadId, this._client.beta.threads.runs, body, options);
  }
  /**
   * A helper to poll a run status until it reaches a terminal state. More
   * information on Run lifecycles can be found here:
   * https://platform.openai.com/docs/assistants/how-it-works/runs-and-run-steps
   */
  async poll(runId, params, options) {
    const headers = buildHeaders([
      options?.headers,
      {
        "X-Stainless-Poll-Helper": "true",
        "X-Stainless-Custom-Poll-Interval": options?.pollIntervalMs?.toString() ?? void 0
      }
    ]);
    while (true) {
      const { data: run, response } = await this.retrieve(runId, params, {
        ...options,
        headers: { ...options?.headers, ...headers }
      }).withResponse();
      switch (run.status) {
        //If we are in any sort of intermediate state we poll
        case "queued":
        case "in_progress":
        case "cancelling":
          let sleepInterval = 5e3;
          if (options?.pollIntervalMs) {
            sleepInterval = options.pollIntervalMs;
          } else {
            const headerInterval = response.headers.get("openai-poll-after-ms");
            if (headerInterval) {
              const headerIntervalMs = parseInt(headerInterval);
              if (!isNaN(headerIntervalMs)) {
                sleepInterval = headerIntervalMs;
              }
            }
          }
          await sleep(sleepInterval);
          break;
        //We return the run in any terminal state.
        case "requires_action":
        case "incomplete":
        case "cancelled":
        case "completed":
        case "failed":
        case "expired":
          return run;
      }
    }
  }
  /**
   * Create a Run stream
   */
  stream(threadId, body, options) {
    return AssistantStream.createAssistantStream(threadId, this._client.beta.threads.runs, body, options);
  }
  submitToolOutputs(runID, params, options) {
    const { thread_id, ...body } = params;
    return this._client.post(path`/threads/${thread_id}/runs/${runID}/submit_tool_outputs`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers]),
      stream: params.stream ?? false
    });
  }
  /**
   * A helper to submit a tool output to a run and poll for a terminal run state.
   * More information on Run lifecycles can be found here:
   * https://platform.openai.com/docs/assistants/how-it-works/runs-and-run-steps
   */
  async submitToolOutputsAndPoll(runId, params, options) {
    const run = await this.submitToolOutputs(runId, params, options);
    return await this.poll(run.id, params, options);
  }
  /**
   * Submit the tool outputs from a previous run and stream the run to a terminal
   * state. More information on Run lifecycles can be found here:
   * https://platform.openai.com/docs/assistants/how-it-works/runs-and-run-steps
   */
  submitToolOutputsStream(runId, params, options) {
    return AssistantStream.createToolAssistantStream(runId, this._client.beta.threads.runs, params, options);
  }
};
Runs.Steps = Steps;

// node_modules/openai/resources/beta/threads/threads.mjs
var Threads2 = class extends APIResource {
  constructor() {
    super(...arguments);
    this.runs = new Runs(this._client);
    this.messages = new Messages2(this._client);
  }
  /**
   * Create a thread.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  create(body = {}, options) {
    return this._client.post("/threads", {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Retrieves a thread.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  retrieve(threadID, options) {
    return this._client.get(path`/threads/${threadID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Modifies a thread.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  update(threadID, body, options) {
    return this._client.post(path`/threads/${threadID}`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Delete a thread.
   *
   * @deprecated The Assistants API is deprecated in favor of the Responses API
   */
  delete(threadID, options) {
    return this._client.delete(path`/threads/${threadID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  createAndRun(body, options) {
    return this._client.post("/threads/runs", {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers]),
      stream: body.stream ?? false
    });
  }
  /**
   * A helper to create a thread, start a run and then poll for a terminal state.
   * More information on Run lifecycles can be found here:
   * https://platform.openai.com/docs/assistants/how-it-works/runs-and-run-steps
   */
  async createAndRunPoll(body, options) {
    const run = await this.createAndRun(body, options);
    return await this.runs.poll(run.id, { thread_id: run.thread_id }, options);
  }
  /**
   * Create a thread and stream the run back
   */
  createAndRunStream(body, options) {
    return AssistantStream.createThreadAssistantStream(body, this._client.beta.threads, options);
  }
};
Threads2.Runs = Runs;
Threads2.Messages = Messages2;

// node_modules/openai/resources/beta/beta.mjs
var Beta = class extends APIResource {
  constructor() {
    super(...arguments);
    this.realtime = new Realtime(this._client);
    this.chatkit = new ChatKit(this._client);
    this.assistants = new Assistants(this._client);
    this.threads = new Threads2(this._client);
  }
};
Beta.Realtime = Realtime;
Beta.ChatKit = ChatKit;
Beta.Assistants = Assistants;
Beta.Threads = Threads2;

// node_modules/openai/resources/completions.mjs
var Completions2 = class extends APIResource {
  create(body, options) {
    return this._client.post("/completions", { body, ...options, stream: body.stream ?? false });
  }
};

// node_modules/openai/resources/containers/files/content.mjs
var Content = class extends APIResource {
  /**
   * Retrieve Container File Content
   */
  retrieve(fileID, params, options) {
    const { container_id } = params;
    return this._client.get(path`/containers/${container_id}/files/${fileID}/content`, {
      ...options,
      headers: buildHeaders([{ Accept: "application/binary" }, options?.headers]),
      __binaryResponse: true
    });
  }
};

// node_modules/openai/resources/containers/files/files.mjs
var Files = class extends APIResource {
  constructor() {
    super(...arguments);
    this.content = new Content(this._client);
  }
  /**
   * Create a Container File
   *
   * You can send either a multipart/form-data request with the raw file content, or
   * a JSON request with a file ID.
   */
  create(containerID, body, options) {
    return this._client.post(path`/containers/${containerID}/files`, multipartFormRequestOptions({ body, ...options }, this._client));
  }
  /**
   * Retrieve Container File
   */
  retrieve(fileID, params, options) {
    const { container_id } = params;
    return this._client.get(path`/containers/${container_id}/files/${fileID}`, options);
  }
  /**
   * List Container files
   */
  list(containerID, query = {}, options) {
    return this._client.getAPIList(path`/containers/${containerID}/files`, CursorPage, {
      query,
      ...options
    });
  }
  /**
   * Delete Container File
   */
  delete(fileID, params, options) {
    const { container_id } = params;
    return this._client.delete(path`/containers/${container_id}/files/${fileID}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};
Files.Content = Content;

// node_modules/openai/resources/containers/containers.mjs
var Containers = class extends APIResource {
  constructor() {
    super(...arguments);
    this.files = new Files(this._client);
  }
  /**
   * Create Container
   */
  create(body, options) {
    return this._client.post("/containers", { body, ...options });
  }
  /**
   * Retrieve Container
   */
  retrieve(containerID, options) {
    return this._client.get(path`/containers/${containerID}`, options);
  }
  /**
   * List Containers
   */
  list(query = {}, options) {
    return this._client.getAPIList("/containers", CursorPage, { query, ...options });
  }
  /**
   * Delete Container
   */
  delete(containerID, options) {
    return this._client.delete(path`/containers/${containerID}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};
Containers.Files = Files;

// node_modules/openai/resources/conversations/items.mjs
var Items = class extends APIResource {
  /**
   * Create items in a conversation with the given ID.
   */
  create(conversationID, params, options) {
    const { include, ...body } = params;
    return this._client.post(path`/conversations/${conversationID}/items`, {
      query: { include },
      body,
      ...options
    });
  }
  /**
   * Get a single item from a conversation with the given IDs.
   */
  retrieve(itemID, params, options) {
    const { conversation_id, ...query } = params;
    return this._client.get(path`/conversations/${conversation_id}/items/${itemID}`, { query, ...options });
  }
  /**
   * List all items for a conversation with the given ID.
   */
  list(conversationID, query = {}, options) {
    return this._client.getAPIList(path`/conversations/${conversationID}/items`, ConversationCursorPage, { query, ...options });
  }
  /**
   * Delete an item from a conversation with the given IDs.
   */
  delete(itemID, params, options) {
    const { conversation_id } = params;
    return this._client.delete(path`/conversations/${conversation_id}/items/${itemID}`, options);
  }
};

// node_modules/openai/resources/conversations/conversations.mjs
var Conversations = class extends APIResource {
  constructor() {
    super(...arguments);
    this.items = new Items(this._client);
  }
  /**
   * Create a conversation.
   */
  create(body = {}, options) {
    return this._client.post("/conversations", { body, ...options });
  }
  /**
   * Get a conversation
   */
  retrieve(conversationID, options) {
    return this._client.get(path`/conversations/${conversationID}`, options);
  }
  /**
   * Update a conversation
   */
  update(conversationID, body, options) {
    return this._client.post(path`/conversations/${conversationID}`, { body, ...options });
  }
  /**
   * Delete a conversation. Items in the conversation will not be deleted.
   */
  delete(conversationID, options) {
    return this._client.delete(path`/conversations/${conversationID}`, options);
  }
};
Conversations.Items = Items;

// node_modules/openai/resources/embeddings.mjs
var Embeddings = class extends APIResource {
  /**
   * Creates an embedding vector representing the input text.
   *
   * @example
   * ```ts
   * const createEmbeddingResponse =
   *   await client.embeddings.create({
   *     input: 'The quick brown fox jumped over the lazy dog',
   *     model: 'text-embedding-3-small',
   *   });
   * ```
   */
  create(body, options) {
    const hasUserProvidedEncodingFormat = !!body.encoding_format;
    let encoding_format = hasUserProvidedEncodingFormat ? body.encoding_format : "base64";
    if (hasUserProvidedEncodingFormat) {
      loggerFor(this._client).debug("embeddings/user defined encoding_format:", body.encoding_format);
    }
    const response = this._client.post("/embeddings", {
      body: {
        ...body,
        encoding_format
      },
      ...options
    });
    if (hasUserProvidedEncodingFormat) {
      return response;
    }
    loggerFor(this._client).debug("embeddings/decoding base64 embeddings from base64");
    return response._thenUnwrap((response2) => {
      if (response2 && response2.data) {
        response2.data.forEach((embeddingBase64Obj) => {
          const embeddingBase64Str = embeddingBase64Obj.embedding;
          embeddingBase64Obj.embedding = toFloat32Array(embeddingBase64Str);
        });
      }
      return response2;
    });
  }
};

// node_modules/openai/resources/evals/runs/output-items.mjs
var OutputItems = class extends APIResource {
  /**
   * Get an evaluation run output item by ID.
   */
  retrieve(outputItemID, params, options) {
    const { eval_id, run_id } = params;
    return this._client.get(path`/evals/${eval_id}/runs/${run_id}/output_items/${outputItemID}`, options);
  }
  /**
   * Get a list of output items for an evaluation run.
   */
  list(runID, params, options) {
    const { eval_id, ...query } = params;
    return this._client.getAPIList(path`/evals/${eval_id}/runs/${runID}/output_items`, CursorPage, { query, ...options });
  }
};

// node_modules/openai/resources/evals/runs/runs.mjs
var Runs2 = class extends APIResource {
  constructor() {
    super(...arguments);
    this.outputItems = new OutputItems(this._client);
  }
  /**
   * Kicks off a new run for a given evaluation, specifying the data source, and what
   * model configuration to use to test. The datasource will be validated against the
   * schema specified in the config of the evaluation.
   */
  create(evalID, body, options) {
    return this._client.post(path`/evals/${evalID}/runs`, { body, ...options });
  }
  /**
   * Get an evaluation run by ID.
   */
  retrieve(runID, params, options) {
    const { eval_id } = params;
    return this._client.get(path`/evals/${eval_id}/runs/${runID}`, options);
  }
  /**
   * Get a list of runs for an evaluation.
   */
  list(evalID, query = {}, options) {
    return this._client.getAPIList(path`/evals/${evalID}/runs`, CursorPage, {
      query,
      ...options
    });
  }
  /**
   * Delete an eval run.
   */
  delete(runID, params, options) {
    const { eval_id } = params;
    return this._client.delete(path`/evals/${eval_id}/runs/${runID}`, options);
  }
  /**
   * Cancel an ongoing evaluation run.
   */
  cancel(runID, params, options) {
    const { eval_id } = params;
    return this._client.post(path`/evals/${eval_id}/runs/${runID}`, options);
  }
};
Runs2.OutputItems = OutputItems;

// node_modules/openai/resources/evals/evals.mjs
var Evals = class extends APIResource {
  constructor() {
    super(...arguments);
    this.runs = new Runs2(this._client);
  }
  /**
   * Create the structure of an evaluation that can be used to test a model's
   * performance. An evaluation is a set of testing criteria and the config for a
   * data source, which dictates the schema of the data used in the evaluation. After
   * creating an evaluation, you can run it on different models and model parameters.
   * We support several types of graders and datasources. For more information, see
   * the [Evals guide](https://platform.openai.com/docs/guides/evals).
   */
  create(body, options) {
    return this._client.post("/evals", { body, ...options });
  }
  /**
   * Get an evaluation by ID.
   */
  retrieve(evalID, options) {
    return this._client.get(path`/evals/${evalID}`, options);
  }
  /**
   * Update certain properties of an evaluation.
   */
  update(evalID, body, options) {
    return this._client.post(path`/evals/${evalID}`, { body, ...options });
  }
  /**
   * List evaluations for a project.
   */
  list(query = {}, options) {
    return this._client.getAPIList("/evals", CursorPage, { query, ...options });
  }
  /**
   * Delete an evaluation.
   */
  delete(evalID, options) {
    return this._client.delete(path`/evals/${evalID}`, options);
  }
};
Evals.Runs = Runs2;

// node_modules/openai/resources/files.mjs
var Files2 = class extends APIResource {
  /**
   * Upload a file that can be used across various endpoints. Individual files can be
   * up to 512 MB, and the size of all files uploaded by one organization can be up
   * to 1 TB.
   *
   * - The Assistants API supports files up to 2 million tokens and of specific file
   *   types. See the
   *   [Assistants Tools guide](https://platform.openai.com/docs/assistants/tools)
   *   for details.
   * - The Fine-tuning API only supports `.jsonl` files. The input also has certain
   *   required formats for fine-tuning
   *   [chat](https://platform.openai.com/docs/api-reference/fine-tuning/chat-input)
   *   or
   *   [completions](https://platform.openai.com/docs/api-reference/fine-tuning/completions-input)
   *   models.
   * - The Batch API only supports `.jsonl` files up to 200 MB in size. The input
   *   also has a specific required
   *   [format](https://platform.openai.com/docs/api-reference/batch/request-input).
   *
   * Please [contact us](https://help.openai.com/) if you need to increase these
   * storage limits.
   */
  create(body, options) {
    return this._client.post("/files", multipartFormRequestOptions({ body, ...options }, this._client));
  }
  /**
   * Returns information about a specific file.
   */
  retrieve(fileID, options) {
    return this._client.get(path`/files/${fileID}`, options);
  }
  /**
   * Returns a list of files.
   */
  list(query = {}, options) {
    return this._client.getAPIList("/files", CursorPage, { query, ...options });
  }
  /**
   * Delete a file and remove it from all vector stores.
   */
  delete(fileID, options) {
    return this._client.delete(path`/files/${fileID}`, options);
  }
  /**
   * Returns the contents of the specified file.
   */
  content(fileID, options) {
    return this._client.get(path`/files/${fileID}/content`, {
      ...options,
      headers: buildHeaders([{ Accept: "application/binary" }, options?.headers]),
      __binaryResponse: true
    });
  }
  /**
   * Waits for the given file to be processed, default timeout is 30 mins.
   */
  async waitForProcessing(id, { pollInterval = 5e3, maxWait = 30 * 60 * 1e3 } = {}) {
    const TERMINAL_STATES = /* @__PURE__ */ new Set(["processed", "error", "deleted"]);
    const start = Date.now();
    let file = await this.retrieve(id);
    while (!file.status || !TERMINAL_STATES.has(file.status)) {
      await sleep(pollInterval);
      file = await this.retrieve(id);
      if (Date.now() - start > maxWait) {
        throw new APIConnectionTimeoutError({
          message: `Giving up on waiting for file ${id} to finish processing after ${maxWait} milliseconds.`
        });
      }
    }
    return file;
  }
};

// node_modules/openai/resources/fine-tuning/methods.mjs
var Methods = class extends APIResource {
};

// node_modules/openai/resources/fine-tuning/alpha/graders.mjs
var Graders = class extends APIResource {
  /**
   * Run a grader.
   *
   * @example
   * ```ts
   * const response = await client.fineTuning.alpha.graders.run({
   *   grader: {
   *     input: 'input',
   *     name: 'name',
   *     operation: 'eq',
   *     reference: 'reference',
   *     type: 'string_check',
   *   },
   *   model_sample: 'model_sample',
   * });
   * ```
   */
  run(body, options) {
    return this._client.post("/fine_tuning/alpha/graders/run", { body, ...options });
  }
  /**
   * Validate a grader.
   *
   * @example
   * ```ts
   * const response =
   *   await client.fineTuning.alpha.graders.validate({
   *     grader: {
   *       input: 'input',
   *       name: 'name',
   *       operation: 'eq',
   *       reference: 'reference',
   *       type: 'string_check',
   *     },
   *   });
   * ```
   */
  validate(body, options) {
    return this._client.post("/fine_tuning/alpha/graders/validate", { body, ...options });
  }
};

// node_modules/openai/resources/fine-tuning/alpha/alpha.mjs
var Alpha = class extends APIResource {
  constructor() {
    super(...arguments);
    this.graders = new Graders(this._client);
  }
};
Alpha.Graders = Graders;

// node_modules/openai/resources/fine-tuning/checkpoints/permissions.mjs
var Permissions = class extends APIResource {
  /**
   * **NOTE:** Calling this endpoint requires an [admin API key](../admin-api-keys).
   *
   * This enables organization owners to share fine-tuned models with other projects
   * in their organization.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const permissionCreateResponse of client.fineTuning.checkpoints.permissions.create(
   *   'ft:gpt-4o-mini-2024-07-18:org:weather:B7R9VjQd',
   *   { project_ids: ['string'] },
   * )) {
   *   // ...
   * }
   * ```
   */
  create(fineTunedModelCheckpoint, body, options) {
    return this._client.getAPIList(path`/fine_tuning/checkpoints/${fineTunedModelCheckpoint}/permissions`, Page, { body, method: "post", ...options });
  }
  /**
   * **NOTE:** This endpoint requires an [admin API key](../admin-api-keys).
   *
   * Organization owners can use this endpoint to view all permissions for a
   * fine-tuned model checkpoint.
   *
   * @example
   * ```ts
   * const permission =
   *   await client.fineTuning.checkpoints.permissions.retrieve(
   *     'ft-AF1WoRqd3aJAHsqc9NY7iL8F',
   *   );
   * ```
   */
  retrieve(fineTunedModelCheckpoint, query = {}, options) {
    return this._client.get(path`/fine_tuning/checkpoints/${fineTunedModelCheckpoint}/permissions`, {
      query,
      ...options
    });
  }
  /**
   * **NOTE:** This endpoint requires an [admin API key](../admin-api-keys).
   *
   * Organization owners can use this endpoint to delete a permission for a
   * fine-tuned model checkpoint.
   *
   * @example
   * ```ts
   * const permission =
   *   await client.fineTuning.checkpoints.permissions.delete(
   *     'cp_zc4Q7MP6XxulcVzj4MZdwsAB',
   *     {
   *       fine_tuned_model_checkpoint:
   *         'ft:gpt-4o-mini-2024-07-18:org:weather:B7R9VjQd',
   *     },
   *   );
   * ```
   */
  delete(permissionID, params, options) {
    const { fine_tuned_model_checkpoint } = params;
    return this._client.delete(path`/fine_tuning/checkpoints/${fine_tuned_model_checkpoint}/permissions/${permissionID}`, options);
  }
};

// node_modules/openai/resources/fine-tuning/checkpoints/checkpoints.mjs
var Checkpoints = class extends APIResource {
  constructor() {
    super(...arguments);
    this.permissions = new Permissions(this._client);
  }
};
Checkpoints.Permissions = Permissions;

// node_modules/openai/resources/fine-tuning/jobs/checkpoints.mjs
var Checkpoints2 = class extends APIResource {
  /**
   * List checkpoints for a fine-tuning job.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const fineTuningJobCheckpoint of client.fineTuning.jobs.checkpoints.list(
   *   'ft-AF1WoRqd3aJAHsqc9NY7iL8F',
   * )) {
   *   // ...
   * }
   * ```
   */
  list(fineTuningJobID, query = {}, options) {
    return this._client.getAPIList(path`/fine_tuning/jobs/${fineTuningJobID}/checkpoints`, CursorPage, { query, ...options });
  }
};

// node_modules/openai/resources/fine-tuning/jobs/jobs.mjs
var Jobs = class extends APIResource {
  constructor() {
    super(...arguments);
    this.checkpoints = new Checkpoints2(this._client);
  }
  /**
   * Creates a fine-tuning job which begins the process of creating a new model from
   * a given dataset.
   *
   * Response includes details of the enqueued job including job status and the name
   * of the fine-tuned models once complete.
   *
   * [Learn more about fine-tuning](https://platform.openai.com/docs/guides/model-optimization)
   *
   * @example
   * ```ts
   * const fineTuningJob = await client.fineTuning.jobs.create({
   *   model: 'gpt-4o-mini',
   *   training_file: 'file-abc123',
   * });
   * ```
   */
  create(body, options) {
    return this._client.post("/fine_tuning/jobs", { body, ...options });
  }
  /**
   * Get info about a fine-tuning job.
   *
   * [Learn more about fine-tuning](https://platform.openai.com/docs/guides/model-optimization)
   *
   * @example
   * ```ts
   * const fineTuningJob = await client.fineTuning.jobs.retrieve(
   *   'ft-AF1WoRqd3aJAHsqc9NY7iL8F',
   * );
   * ```
   */
  retrieve(fineTuningJobID, options) {
    return this._client.get(path`/fine_tuning/jobs/${fineTuningJobID}`, options);
  }
  /**
   * List your organization's fine-tuning jobs
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const fineTuningJob of client.fineTuning.jobs.list()) {
   *   // ...
   * }
   * ```
   */
  list(query = {}, options) {
    return this._client.getAPIList("/fine_tuning/jobs", CursorPage, { query, ...options });
  }
  /**
   * Immediately cancel a fine-tune job.
   *
   * @example
   * ```ts
   * const fineTuningJob = await client.fineTuning.jobs.cancel(
   *   'ft-AF1WoRqd3aJAHsqc9NY7iL8F',
   * );
   * ```
   */
  cancel(fineTuningJobID, options) {
    return this._client.post(path`/fine_tuning/jobs/${fineTuningJobID}/cancel`, options);
  }
  /**
   * Get status updates for a fine-tuning job.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const fineTuningJobEvent of client.fineTuning.jobs.listEvents(
   *   'ft-AF1WoRqd3aJAHsqc9NY7iL8F',
   * )) {
   *   // ...
   * }
   * ```
   */
  listEvents(fineTuningJobID, query = {}, options) {
    return this._client.getAPIList(path`/fine_tuning/jobs/${fineTuningJobID}/events`, CursorPage, { query, ...options });
  }
  /**
   * Pause a fine-tune job.
   *
   * @example
   * ```ts
   * const fineTuningJob = await client.fineTuning.jobs.pause(
   *   'ft-AF1WoRqd3aJAHsqc9NY7iL8F',
   * );
   * ```
   */
  pause(fineTuningJobID, options) {
    return this._client.post(path`/fine_tuning/jobs/${fineTuningJobID}/pause`, options);
  }
  /**
   * Resume a fine-tune job.
   *
   * @example
   * ```ts
   * const fineTuningJob = await client.fineTuning.jobs.resume(
   *   'ft-AF1WoRqd3aJAHsqc9NY7iL8F',
   * );
   * ```
   */
  resume(fineTuningJobID, options) {
    return this._client.post(path`/fine_tuning/jobs/${fineTuningJobID}/resume`, options);
  }
};
Jobs.Checkpoints = Checkpoints2;

// node_modules/openai/resources/fine-tuning/fine-tuning.mjs
var FineTuning = class extends APIResource {
  constructor() {
    super(...arguments);
    this.methods = new Methods(this._client);
    this.jobs = new Jobs(this._client);
    this.checkpoints = new Checkpoints(this._client);
    this.alpha = new Alpha(this._client);
  }
};
FineTuning.Methods = Methods;
FineTuning.Jobs = Jobs;
FineTuning.Checkpoints = Checkpoints;
FineTuning.Alpha = Alpha;

// node_modules/openai/resources/graders/grader-models.mjs
var GraderModels = class extends APIResource {
};

// node_modules/openai/resources/graders/graders.mjs
var Graders2 = class extends APIResource {
  constructor() {
    super(...arguments);
    this.graderModels = new GraderModels(this._client);
  }
};
Graders2.GraderModels = GraderModels;

// node_modules/openai/resources/images.mjs
var Images = class extends APIResource {
  /**
   * Creates a variation of a given image. This endpoint only supports `dall-e-2`.
   *
   * @example
   * ```ts
   * const imagesResponse = await client.images.createVariation({
   *   image: fs.createReadStream('otter.png'),
   * });
   * ```
   */
  createVariation(body, options) {
    return this._client.post("/images/variations", multipartFormRequestOptions({ body, ...options }, this._client));
  }
  edit(body, options) {
    return this._client.post("/images/edits", multipartFormRequestOptions({ body, ...options, stream: body.stream ?? false }, this._client));
  }
  generate(body, options) {
    return this._client.post("/images/generations", { body, ...options, stream: body.stream ?? false });
  }
};

// node_modules/openai/resources/models.mjs
var Models = class extends APIResource {
  /**
   * Retrieves a model instance, providing basic information about the model such as
   * the owner and permissioning.
   */
  retrieve(model, options) {
    return this._client.get(path`/models/${model}`, options);
  }
  /**
   * Lists the currently available models, and provides basic information about each
   * one such as the owner and availability.
   */
  list(options) {
    return this._client.getAPIList("/models", Page, options);
  }
  /**
   * Delete a fine-tuned model. You must have the Owner role in your organization to
   * delete a model.
   */
  delete(model, options) {
    return this._client.delete(path`/models/${model}`, options);
  }
};

// node_modules/openai/resources/moderations.mjs
var Moderations = class extends APIResource {
  /**
   * Classifies if text and/or image inputs are potentially harmful. Learn more in
   * the [moderation guide](https://platform.openai.com/docs/guides/moderation).
   */
  create(body, options) {
    return this._client.post("/moderations", { body, ...options });
  }
};

// node_modules/openai/resources/realtime/calls.mjs
var Calls = class extends APIResource {
  /**
   * Accept an incoming SIP call and configure the realtime session that will handle
   * it.
   *
   * @example
   * ```ts
   * await client.realtime.calls.accept('call_id', {
   *   type: 'realtime',
   * });
   * ```
   */
  accept(callID, body, options) {
    return this._client.post(path`/realtime/calls/${callID}/accept`, {
      body,
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * End an active Realtime API call, whether it was initiated over SIP or WebRTC.
   *
   * @example
   * ```ts
   * await client.realtime.calls.hangup('call_id');
   * ```
   */
  hangup(callID, options) {
    return this._client.post(path`/realtime/calls/${callID}/hangup`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * Transfer an active SIP call to a new destination using the SIP REFER verb.
   *
   * @example
   * ```ts
   * await client.realtime.calls.refer('call_id', {
   *   target_uri: 'tel:+14155550123',
   * });
   * ```
   */
  refer(callID, body, options) {
    return this._client.post(path`/realtime/calls/${callID}/refer`, {
      body,
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  /**
   * Decline an incoming SIP call by returning a SIP status code to the caller.
   *
   * @example
   * ```ts
   * await client.realtime.calls.reject('call_id');
   * ```
   */
  reject(callID, body = {}, options) {
    return this._client.post(path`/realtime/calls/${callID}/reject`, {
      body,
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
};

// node_modules/openai/resources/realtime/client-secrets.mjs
var ClientSecrets = class extends APIResource {
  /**
   * Create a Realtime client secret with an associated session configuration.
   *
   * @example
   * ```ts
   * const clientSecret =
   *   await client.realtime.clientSecrets.create();
   * ```
   */
  create(body, options) {
    return this._client.post("/realtime/client_secrets", { body, ...options });
  }
};

// node_modules/openai/resources/realtime/realtime.mjs
var Realtime2 = class extends APIResource {
  constructor() {
    super(...arguments);
    this.clientSecrets = new ClientSecrets(this._client);
    this.calls = new Calls(this._client);
  }
};
Realtime2.ClientSecrets = ClientSecrets;
Realtime2.Calls = Calls;

// node_modules/openai/lib/ResponsesParser.mjs
function maybeParseResponse(response, params) {
  if (!params || !hasAutoParseableInput2(params)) {
    return {
      ...response,
      output_parsed: null,
      output: response.output.map((item) => {
        if (item.type === "function_call") {
          return {
            ...item,
            parsed_arguments: null
          };
        }
        if (item.type === "message") {
          return {
            ...item,
            content: item.content.map((content) => ({
              ...content,
              parsed: null
            }))
          };
        } else {
          return item;
        }
      })
    };
  }
  return parseResponse(response, params);
}
function parseResponse(response, params) {
  const output = response.output.map((item) => {
    if (item.type === "function_call") {
      return {
        ...item,
        parsed_arguments: parseToolCall2(params, item)
      };
    }
    if (item.type === "message") {
      const content = item.content.map((content2) => {
        if (content2.type === "output_text") {
          return {
            ...content2,
            parsed: parseTextFormat(params, content2.text)
          };
        }
        return content2;
      });
      return {
        ...item,
        content
      };
    }
    return item;
  });
  const parsed = Object.assign({}, response, { output });
  if (!Object.getOwnPropertyDescriptor(response, "output_text")) {
    addOutputText(parsed);
  }
  Object.defineProperty(parsed, "output_parsed", {
    enumerable: true,
    get() {
      for (const output2 of parsed.output) {
        if (output2.type !== "message") {
          continue;
        }
        for (const content of output2.content) {
          if (content.type === "output_text" && content.parsed !== null) {
            return content.parsed;
          }
        }
      }
      return null;
    }
  });
  return parsed;
}
function parseTextFormat(params, content) {
  if (params.text?.format?.type !== "json_schema") {
    return null;
  }
  if ("$parseRaw" in params.text?.format) {
    const text_format = params.text?.format;
    return text_format.$parseRaw(content);
  }
  return JSON.parse(content);
}
function hasAutoParseableInput2(params) {
  if (isAutoParsableResponseFormat(params.text?.format)) {
    return true;
  }
  return false;
}
function isAutoParsableTool2(tool) {
  return tool?.["$brand"] === "auto-parseable-tool";
}
function getInputToolByName(input_tools, name) {
  return input_tools.find((tool) => tool.type === "function" && tool.name === name);
}
function parseToolCall2(params, toolCall) {
  const inputTool = getInputToolByName(params.tools ?? [], toolCall.name);
  return {
    ...toolCall,
    ...toolCall,
    parsed_arguments: isAutoParsableTool2(inputTool) ? inputTool.$parseRaw(toolCall.arguments) : inputTool?.strict ? JSON.parse(toolCall.arguments) : null
  };
}
function addOutputText(rsp) {
  const texts = [];
  for (const output of rsp.output) {
    if (output.type !== "message") {
      continue;
    }
    for (const content of output.content) {
      if (content.type === "output_text") {
        texts.push(content.text);
      }
    }
  }
  rsp.output_text = texts.join("");
}

// node_modules/openai/lib/responses/ResponseStream.mjs
var _ResponseStream_instances;
var _ResponseStream_params;
var _ResponseStream_currentResponseSnapshot;
var _ResponseStream_finalResponse;
var _ResponseStream_beginRequest;
var _ResponseStream_addEvent;
var _ResponseStream_endRequest;
var _ResponseStream_accumulateResponse;
var ResponseStream = class _ResponseStream extends EventStream {
  constructor(params) {
    super();
    _ResponseStream_instances.add(this);
    _ResponseStream_params.set(this, void 0);
    _ResponseStream_currentResponseSnapshot.set(this, void 0);
    _ResponseStream_finalResponse.set(this, void 0);
    __classPrivateFieldSet(this, _ResponseStream_params, params, "f");
  }
  static createResponse(client, params, options) {
    const runner = new _ResponseStream(params);
    runner._run(() => runner._createOrRetrieveResponse(client, params, {
      ...options,
      headers: { ...options?.headers, "X-Stainless-Helper-Method": "stream" }
    }));
    return runner;
  }
  async _createOrRetrieveResponse(client, params, options) {
    const signal = options?.signal;
    if (signal) {
      if (signal.aborted)
        this.controller.abort();
      signal.addEventListener("abort", () => this.controller.abort());
    }
    __classPrivateFieldGet(this, _ResponseStream_instances, "m", _ResponseStream_beginRequest).call(this);
    let stream;
    let starting_after = null;
    if ("response_id" in params) {
      stream = await client.responses.retrieve(params.response_id, { stream: true }, { ...options, signal: this.controller.signal, stream: true });
      starting_after = params.starting_after ?? null;
    } else {
      stream = await client.responses.create({ ...params, stream: true }, { ...options, signal: this.controller.signal });
    }
    this._connected();
    for await (const event of stream) {
      __classPrivateFieldGet(this, _ResponseStream_instances, "m", _ResponseStream_addEvent).call(this, event, starting_after);
    }
    if (stream.controller.signal?.aborted) {
      throw new APIUserAbortError();
    }
    return __classPrivateFieldGet(this, _ResponseStream_instances, "m", _ResponseStream_endRequest).call(this);
  }
  [(_ResponseStream_params = /* @__PURE__ */ new WeakMap(), _ResponseStream_currentResponseSnapshot = /* @__PURE__ */ new WeakMap(), _ResponseStream_finalResponse = /* @__PURE__ */ new WeakMap(), _ResponseStream_instances = /* @__PURE__ */ new WeakSet(), _ResponseStream_beginRequest = function _ResponseStream_beginRequest2() {
    if (this.ended)
      return;
    __classPrivateFieldSet(this, _ResponseStream_currentResponseSnapshot, void 0, "f");
  }, _ResponseStream_addEvent = function _ResponseStream_addEvent2(event, starting_after) {
    if (this.ended)
      return;
    const maybeEmit = (name, event2) => {
      if (starting_after == null || event2.sequence_number > starting_after) {
        this._emit(name, event2);
      }
    };
    const response = __classPrivateFieldGet(this, _ResponseStream_instances, "m", _ResponseStream_accumulateResponse).call(this, event);
    maybeEmit("event", event);
    switch (event.type) {
      case "response.output_text.delta": {
        const output = response.output[event.output_index];
        if (!output) {
          throw new OpenAIError(`missing output at index ${event.output_index}`);
        }
        if (output.type === "message") {
          const content = output.content[event.content_index];
          if (!content) {
            throw new OpenAIError(`missing content at index ${event.content_index}`);
          }
          if (content.type !== "output_text") {
            throw new OpenAIError(`expected content to be 'output_text', got ${content.type}`);
          }
          maybeEmit("response.output_text.delta", {
            ...event,
            snapshot: content.text
          });
        }
        break;
      }
      case "response.function_call_arguments.delta": {
        const output = response.output[event.output_index];
        if (!output) {
          throw new OpenAIError(`missing output at index ${event.output_index}`);
        }
        if (output.type === "function_call") {
          maybeEmit("response.function_call_arguments.delta", {
            ...event,
            snapshot: output.arguments
          });
        }
        break;
      }
      default:
        maybeEmit(event.type, event);
        break;
    }
  }, _ResponseStream_endRequest = function _ResponseStream_endRequest2() {
    if (this.ended) {
      throw new OpenAIError(`stream has ended, this shouldn't happen`);
    }
    const snapshot = __classPrivateFieldGet(this, _ResponseStream_currentResponseSnapshot, "f");
    if (!snapshot) {
      throw new OpenAIError(`request ended without sending any events`);
    }
    __classPrivateFieldSet(this, _ResponseStream_currentResponseSnapshot, void 0, "f");
    const parsedResponse = finalizeResponse(snapshot, __classPrivateFieldGet(this, _ResponseStream_params, "f"));
    __classPrivateFieldSet(this, _ResponseStream_finalResponse, parsedResponse, "f");
    return parsedResponse;
  }, _ResponseStream_accumulateResponse = function _ResponseStream_accumulateResponse2(event) {
    let snapshot = __classPrivateFieldGet(this, _ResponseStream_currentResponseSnapshot, "f");
    if (!snapshot) {
      if (event.type !== "response.created") {
        throw new OpenAIError(`When snapshot hasn't been set yet, expected 'response.created' event, got ${event.type}`);
      }
      snapshot = __classPrivateFieldSet(this, _ResponseStream_currentResponseSnapshot, event.response, "f");
      return snapshot;
    }
    switch (event.type) {
      case "response.output_item.added": {
        snapshot.output.push(event.item);
        break;
      }
      case "response.content_part.added": {
        const output = snapshot.output[event.output_index];
        if (!output) {
          throw new OpenAIError(`missing output at index ${event.output_index}`);
        }
        const type = output.type;
        const part = event.part;
        if (type === "message" && part.type !== "reasoning_text") {
          output.content.push(part);
        } else if (type === "reasoning" && part.type === "reasoning_text") {
          if (!output.content) {
            output.content = [];
          }
          output.content.push(part);
        }
        break;
      }
      case "response.output_text.delta": {
        const output = snapshot.output[event.output_index];
        if (!output) {
          throw new OpenAIError(`missing output at index ${event.output_index}`);
        }
        if (output.type === "message") {
          const content = output.content[event.content_index];
          if (!content) {
            throw new OpenAIError(`missing content at index ${event.content_index}`);
          }
          if (content.type !== "output_text") {
            throw new OpenAIError(`expected content to be 'output_text', got ${content.type}`);
          }
          content.text += event.delta;
        }
        break;
      }
      case "response.function_call_arguments.delta": {
        const output = snapshot.output[event.output_index];
        if (!output) {
          throw new OpenAIError(`missing output at index ${event.output_index}`);
        }
        if (output.type === "function_call") {
          output.arguments += event.delta;
        }
        break;
      }
      case "response.reasoning_text.delta": {
        const output = snapshot.output[event.output_index];
        if (!output) {
          throw new OpenAIError(`missing output at index ${event.output_index}`);
        }
        if (output.type === "reasoning") {
          const content = output.content?.[event.content_index];
          if (!content) {
            throw new OpenAIError(`missing content at index ${event.content_index}`);
          }
          if (content.type !== "reasoning_text") {
            throw new OpenAIError(`expected content to be 'reasoning_text', got ${content.type}`);
          }
          content.text += event.delta;
        }
        break;
      }
      case "response.completed": {
        __classPrivateFieldSet(this, _ResponseStream_currentResponseSnapshot, event.response, "f");
        break;
      }
    }
    return snapshot;
  }, Symbol.asyncIterator)]() {
    const pushQueue = [];
    const readQueue = [];
    let done = false;
    this.on("event", (event) => {
      const reader = readQueue.shift();
      if (reader) {
        reader.resolve(event);
      } else {
        pushQueue.push(event);
      }
    });
    this.on("end", () => {
      done = true;
      for (const reader of readQueue) {
        reader.resolve(void 0);
      }
      readQueue.length = 0;
    });
    this.on("abort", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    this.on("error", (err) => {
      done = true;
      for (const reader of readQueue) {
        reader.reject(err);
      }
      readQueue.length = 0;
    });
    return {
      next: async () => {
        if (!pushQueue.length) {
          if (done) {
            return { value: void 0, done: true };
          }
          return new Promise((resolve, reject) => readQueue.push({ resolve, reject })).then((event2) => event2 ? { value: event2, done: false } : { value: void 0, done: true });
        }
        const event = pushQueue.shift();
        return { value: event, done: false };
      },
      return: async () => {
        this.abort();
        return { value: void 0, done: true };
      }
    };
  }
  /**
   * @returns a promise that resolves with the final Response, or rejects
   * if an error occurred or the stream ended prematurely without producing a REsponse.
   */
  async finalResponse() {
    await this.done();
    const response = __classPrivateFieldGet(this, _ResponseStream_finalResponse, "f");
    if (!response)
      throw new OpenAIError("stream ended without producing a ChatCompletion");
    return response;
  }
};
function finalizeResponse(snapshot, params) {
  return maybeParseResponse(snapshot, params);
}

// node_modules/openai/resources/responses/input-items.mjs
var InputItems = class extends APIResource {
  /**
   * Returns a list of input items for a given response.
   *
   * @example
   * ```ts
   * // Automatically fetches more pages as needed.
   * for await (const responseItem of client.responses.inputItems.list(
   *   'response_id',
   * )) {
   *   // ...
   * }
   * ```
   */
  list(responseID, query = {}, options) {
    return this._client.getAPIList(path`/responses/${responseID}/input_items`, CursorPage, { query, ...options });
  }
};

// node_modules/openai/resources/responses/input-tokens.mjs
var InputTokens = class extends APIResource {
  /**
   * Get input token counts
   *
   * @example
   * ```ts
   * const response = await client.responses.inputTokens.count();
   * ```
   */
  count(body = {}, options) {
    return this._client.post("/responses/input_tokens", { body, ...options });
  }
};

// node_modules/openai/resources/responses/responses.mjs
var Responses = class extends APIResource {
  constructor() {
    super(...arguments);
    this.inputItems = new InputItems(this._client);
    this.inputTokens = new InputTokens(this._client);
  }
  create(body, options) {
    return this._client.post("/responses", { body, ...options, stream: body.stream ?? false })._thenUnwrap((rsp) => {
      if ("object" in rsp && rsp.object === "response") {
        addOutputText(rsp);
      }
      return rsp;
    });
  }
  retrieve(responseID, query = {}, options) {
    return this._client.get(path`/responses/${responseID}`, {
      query,
      ...options,
      stream: query?.stream ?? false
    })._thenUnwrap((rsp) => {
      if ("object" in rsp && rsp.object === "response") {
        addOutputText(rsp);
      }
      return rsp;
    });
  }
  /**
   * Deletes a model response with the given ID.
   *
   * @example
   * ```ts
   * await client.responses.delete(
   *   'resp_677efb5139a88190b512bc3fef8e535d',
   * );
   * ```
   */
  delete(responseID, options) {
    return this._client.delete(path`/responses/${responseID}`, {
      ...options,
      headers: buildHeaders([{ Accept: "*/*" }, options?.headers])
    });
  }
  parse(body, options) {
    return this._client.responses.create(body, options)._thenUnwrap((response) => parseResponse(response, body));
  }
  /**
   * Creates a model response stream
   */
  stream(body, options) {
    return ResponseStream.createResponse(this._client, body, options);
  }
  /**
   * Cancels a model response with the given ID. Only responses created with the
   * `background` parameter set to `true` can be cancelled.
   * [Learn more](https://platform.openai.com/docs/guides/background).
   *
   * @example
   * ```ts
   * const response = await client.responses.cancel(
   *   'resp_677efb5139a88190b512bc3fef8e535d',
   * );
   * ```
   */
  cancel(responseID, options) {
    return this._client.post(path`/responses/${responseID}/cancel`, options);
  }
  /**
   * Compact conversation
   *
   * @example
   * ```ts
   * const compactedResponse = await client.responses.compact({
   *   model: 'gpt-5.2',
   * });
   * ```
   */
  compact(body, options) {
    return this._client.post("/responses/compact", { body, ...options });
  }
};
Responses.InputItems = InputItems;
Responses.InputTokens = InputTokens;

// node_modules/openai/resources/uploads/parts.mjs
var Parts = class extends APIResource {
  /**
   * Adds a
   * [Part](https://platform.openai.com/docs/api-reference/uploads/part-object) to an
   * [Upload](https://platform.openai.com/docs/api-reference/uploads/object) object.
   * A Part represents a chunk of bytes from the file you are trying to upload.
   *
   * Each Part can be at most 64 MB, and you can add Parts until you hit the Upload
   * maximum of 8 GB.
   *
   * It is possible to add multiple Parts in parallel. You can decide the intended
   * order of the Parts when you
   * [complete the Upload](https://platform.openai.com/docs/api-reference/uploads/complete).
   */
  create(uploadID, body, options) {
    return this._client.post(path`/uploads/${uploadID}/parts`, multipartFormRequestOptions({ body, ...options }, this._client));
  }
};

// node_modules/openai/resources/uploads/uploads.mjs
var Uploads = class extends APIResource {
  constructor() {
    super(...arguments);
    this.parts = new Parts(this._client);
  }
  /**
   * Creates an intermediate
   * [Upload](https://platform.openai.com/docs/api-reference/uploads/object) object
   * that you can add
   * [Parts](https://platform.openai.com/docs/api-reference/uploads/part-object) to.
   * Currently, an Upload can accept at most 8 GB in total and expires after an hour
   * after you create it.
   *
   * Once you complete the Upload, we will create a
   * [File](https://platform.openai.com/docs/api-reference/files/object) object that
   * contains all the parts you uploaded. This File is usable in the rest of our
   * platform as a regular File object.
   *
   * For certain `purpose` values, the correct `mime_type` must be specified. Please
   * refer to documentation for the
   * [supported MIME types for your use case](https://platform.openai.com/docs/assistants/tools/file-search#supported-files).
   *
   * For guidance on the proper filename extensions for each purpose, please follow
   * the documentation on
   * [creating a File](https://platform.openai.com/docs/api-reference/files/create).
   */
  create(body, options) {
    return this._client.post("/uploads", { body, ...options });
  }
  /**
   * Cancels the Upload. No Parts may be added after an Upload is cancelled.
   */
  cancel(uploadID, options) {
    return this._client.post(path`/uploads/${uploadID}/cancel`, options);
  }
  /**
   * Completes the
   * [Upload](https://platform.openai.com/docs/api-reference/uploads/object).
   *
   * Within the returned Upload object, there is a nested
   * [File](https://platform.openai.com/docs/api-reference/files/object) object that
   * is ready to use in the rest of the platform.
   *
   * You can specify the order of the Parts by passing in an ordered list of the Part
   * IDs.
   *
   * The number of bytes uploaded upon completion must match the number of bytes
   * initially specified when creating the Upload object. No Parts may be added after
   * an Upload is completed.
   */
  complete(uploadID, body, options) {
    return this._client.post(path`/uploads/${uploadID}/complete`, { body, ...options });
  }
};
Uploads.Parts = Parts;

// node_modules/openai/lib/Util.mjs
var allSettledWithThrow = async (promises) => {
  const results = await Promise.allSettled(promises);
  const rejected = results.filter((result) => result.status === "rejected");
  if (rejected.length) {
    for (const result of rejected) {
      console.error(result.reason);
    }
    throw new Error(`${rejected.length} promise(s) failed - see the above errors`);
  }
  const values = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      values.push(result.value);
    }
  }
  return values;
};

// node_modules/openai/resources/vector-stores/file-batches.mjs
var FileBatches = class extends APIResource {
  /**
   * Create a vector store file batch.
   */
  create(vectorStoreID, body, options) {
    return this._client.post(path`/vector_stores/${vectorStoreID}/file_batches`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Retrieves a vector store file batch.
   */
  retrieve(batchID, params, options) {
    const { vector_store_id } = params;
    return this._client.get(path`/vector_stores/${vector_store_id}/file_batches/${batchID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Cancel a vector store file batch. This attempts to cancel the processing of
   * files in this batch as soon as possible.
   */
  cancel(batchID, params, options) {
    const { vector_store_id } = params;
    return this._client.post(path`/vector_stores/${vector_store_id}/file_batches/${batchID}/cancel`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Create a vector store batch and poll until all files have been processed.
   */
  async createAndPoll(vectorStoreId, body, options) {
    const batch = await this.create(vectorStoreId, body);
    return await this.poll(vectorStoreId, batch.id, options);
  }
  /**
   * Returns a list of vector store files in a batch.
   */
  listFiles(batchID, params, options) {
    const { vector_store_id, ...query } = params;
    return this._client.getAPIList(path`/vector_stores/${vector_store_id}/file_batches/${batchID}/files`, CursorPage, { query, ...options, headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers]) });
  }
  /**
   * Wait for the given file batch to be processed.
   *
   * Note: this will return even if one of the files failed to process, you need to
   * check batch.file_counts.failed_count to handle this case.
   */
  async poll(vectorStoreID, batchID, options) {
    const headers = buildHeaders([
      options?.headers,
      {
        "X-Stainless-Poll-Helper": "true",
        "X-Stainless-Custom-Poll-Interval": options?.pollIntervalMs?.toString() ?? void 0
      }
    ]);
    while (true) {
      const { data: batch, response } = await this.retrieve(batchID, { vector_store_id: vectorStoreID }, {
        ...options,
        headers
      }).withResponse();
      switch (batch.status) {
        case "in_progress":
          let sleepInterval = 5e3;
          if (options?.pollIntervalMs) {
            sleepInterval = options.pollIntervalMs;
          } else {
            const headerInterval = response.headers.get("openai-poll-after-ms");
            if (headerInterval) {
              const headerIntervalMs = parseInt(headerInterval);
              if (!isNaN(headerIntervalMs)) {
                sleepInterval = headerIntervalMs;
              }
            }
          }
          await sleep(sleepInterval);
          break;
        case "failed":
        case "cancelled":
        case "completed":
          return batch;
      }
    }
  }
  /**
   * Uploads the given files concurrently and then creates a vector store file batch.
   *
   * The concurrency limit is configurable using the `maxConcurrency` parameter.
   */
  async uploadAndPoll(vectorStoreId, { files, fileIds = [] }, options) {
    if (files == null || files.length == 0) {
      throw new Error(`No \`files\` provided to process. If you've already uploaded files you should use \`.createAndPoll()\` instead`);
    }
    const configuredConcurrency = options?.maxConcurrency ?? 5;
    const concurrencyLimit = Math.min(configuredConcurrency, files.length);
    const client = this._client;
    const fileIterator = files.values();
    const allFileIds = [...fileIds];
    async function processFiles(iterator) {
      for (let item of iterator) {
        const fileObj = await client.files.create({ file: item, purpose: "assistants" }, options);
        allFileIds.push(fileObj.id);
      }
    }
    const workers = Array(concurrencyLimit).fill(fileIterator).map(processFiles);
    await allSettledWithThrow(workers);
    return await this.createAndPoll(vectorStoreId, {
      file_ids: allFileIds
    });
  }
};

// node_modules/openai/resources/vector-stores/files.mjs
var Files3 = class extends APIResource {
  /**
   * Create a vector store file by attaching a
   * [File](https://platform.openai.com/docs/api-reference/files) to a
   * [vector store](https://platform.openai.com/docs/api-reference/vector-stores/object).
   */
  create(vectorStoreID, body, options) {
    return this._client.post(path`/vector_stores/${vectorStoreID}/files`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Retrieves a vector store file.
   */
  retrieve(fileID, params, options) {
    const { vector_store_id } = params;
    return this._client.get(path`/vector_stores/${vector_store_id}/files/${fileID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Update attributes on a vector store file.
   */
  update(fileID, params, options) {
    const { vector_store_id, ...body } = params;
    return this._client.post(path`/vector_stores/${vector_store_id}/files/${fileID}`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Returns a list of vector store files.
   */
  list(vectorStoreID, query = {}, options) {
    return this._client.getAPIList(path`/vector_stores/${vectorStoreID}/files`, CursorPage, {
      query,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Delete a vector store file. This will remove the file from the vector store but
   * the file itself will not be deleted. To delete the file, use the
   * [delete file](https://platform.openai.com/docs/api-reference/files/delete)
   * endpoint.
   */
  delete(fileID, params, options) {
    const { vector_store_id } = params;
    return this._client.delete(path`/vector_stores/${vector_store_id}/files/${fileID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Attach a file to the given vector store and wait for it to be processed.
   */
  async createAndPoll(vectorStoreId, body, options) {
    const file = await this.create(vectorStoreId, body, options);
    return await this.poll(vectorStoreId, file.id, options);
  }
  /**
   * Wait for the vector store file to finish processing.
   *
   * Note: this will return even if the file failed to process, you need to check
   * file.last_error and file.status to handle these cases
   */
  async poll(vectorStoreID, fileID, options) {
    const headers = buildHeaders([
      options?.headers,
      {
        "X-Stainless-Poll-Helper": "true",
        "X-Stainless-Custom-Poll-Interval": options?.pollIntervalMs?.toString() ?? void 0
      }
    ]);
    while (true) {
      const fileResponse = await this.retrieve(fileID, {
        vector_store_id: vectorStoreID
      }, { ...options, headers }).withResponse();
      const file = fileResponse.data;
      switch (file.status) {
        case "in_progress":
          let sleepInterval = 5e3;
          if (options?.pollIntervalMs) {
            sleepInterval = options.pollIntervalMs;
          } else {
            const headerInterval = fileResponse.response.headers.get("openai-poll-after-ms");
            if (headerInterval) {
              const headerIntervalMs = parseInt(headerInterval);
              if (!isNaN(headerIntervalMs)) {
                sleepInterval = headerIntervalMs;
              }
            }
          }
          await sleep(sleepInterval);
          break;
        case "failed":
        case "completed":
          return file;
      }
    }
  }
  /**
   * Upload a file to the `files` API and then attach it to the given vector store.
   *
   * Note the file will be asynchronously processed (you can use the alternative
   * polling helper method to wait for processing to complete).
   */
  async upload(vectorStoreId, file, options) {
    const fileInfo = await this._client.files.create({ file, purpose: "assistants" }, options);
    return this.create(vectorStoreId, { file_id: fileInfo.id }, options);
  }
  /**
   * Add a file to a vector store and poll until processing is complete.
   */
  async uploadAndPoll(vectorStoreId, file, options) {
    const fileInfo = await this.upload(vectorStoreId, file, options);
    return await this.poll(vectorStoreId, fileInfo.id, options);
  }
  /**
   * Retrieve the parsed contents of a vector store file.
   */
  content(fileID, params, options) {
    const { vector_store_id } = params;
    return this._client.getAPIList(path`/vector_stores/${vector_store_id}/files/${fileID}/content`, Page, { ...options, headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers]) });
  }
};

// node_modules/openai/resources/vector-stores/vector-stores.mjs
var VectorStores = class extends APIResource {
  constructor() {
    super(...arguments);
    this.files = new Files3(this._client);
    this.fileBatches = new FileBatches(this._client);
  }
  /**
   * Create a vector store.
   */
  create(body, options) {
    return this._client.post("/vector_stores", {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Retrieves a vector store.
   */
  retrieve(vectorStoreID, options) {
    return this._client.get(path`/vector_stores/${vectorStoreID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Modifies a vector store.
   */
  update(vectorStoreID, body, options) {
    return this._client.post(path`/vector_stores/${vectorStoreID}`, {
      body,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Returns a list of vector stores.
   */
  list(query = {}, options) {
    return this._client.getAPIList("/vector_stores", CursorPage, {
      query,
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Delete a vector store.
   */
  delete(vectorStoreID, options) {
    return this._client.delete(path`/vector_stores/${vectorStoreID}`, {
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
  /**
   * Search a vector store for relevant chunks based on a query and file attributes
   * filter.
   */
  search(vectorStoreID, body, options) {
    return this._client.getAPIList(path`/vector_stores/${vectorStoreID}/search`, Page, {
      body,
      method: "post",
      ...options,
      headers: buildHeaders([{ "OpenAI-Beta": "assistants=v2" }, options?.headers])
    });
  }
};
VectorStores.Files = Files3;
VectorStores.FileBatches = FileBatches;

// node_modules/openai/resources/videos.mjs
var Videos = class extends APIResource {
  /**
   * Create a video
   */
  create(body, options) {
    return this._client.post("/videos", maybeMultipartFormRequestOptions({ body, ...options }, this._client));
  }
  /**
   * Retrieve a video
   */
  retrieve(videoID, options) {
    return this._client.get(path`/videos/${videoID}`, options);
  }
  /**
   * List videos
   */
  list(query = {}, options) {
    return this._client.getAPIList("/videos", ConversationCursorPage, { query, ...options });
  }
  /**
   * Delete a video
   */
  delete(videoID, options) {
    return this._client.delete(path`/videos/${videoID}`, options);
  }
  /**
   * Download video content
   */
  downloadContent(videoID, query = {}, options) {
    return this._client.get(path`/videos/${videoID}/content`, {
      query,
      ...options,
      headers: buildHeaders([{ Accept: "application/binary" }, options?.headers]),
      __binaryResponse: true
    });
  }
  /**
   * Create a video remix
   */
  remix(videoID, body, options) {
    return this._client.post(path`/videos/${videoID}/remix`, maybeMultipartFormRequestOptions({ body, ...options }, this._client));
  }
};

// node_modules/openai/resources/webhooks.mjs
var _Webhooks_instances;
var _Webhooks_validateSecret;
var _Webhooks_getRequiredHeader;
var Webhooks = class extends APIResource {
  constructor() {
    super(...arguments);
    _Webhooks_instances.add(this);
  }
  /**
   * Validates that the given payload was sent by OpenAI and parses the payload.
   */
  async unwrap(payload, headers, secret = this._client.webhookSecret, tolerance = 300) {
    await this.verifySignature(payload, headers, secret, tolerance);
    return JSON.parse(payload);
  }
  /**
   * Validates whether or not the webhook payload was sent by OpenAI.
   *
   * An error will be raised if the webhook payload was not sent by OpenAI.
   *
   * @param payload - The webhook payload
   * @param headers - The webhook headers
   * @param secret - The webhook secret (optional, will use client secret if not provided)
   * @param tolerance - Maximum age of the webhook in seconds (default: 300 = 5 minutes)
   */
  async verifySignature(payload, headers, secret = this._client.webhookSecret, tolerance = 300) {
    if (typeof crypto === "undefined" || typeof crypto.subtle.importKey !== "function" || typeof crypto.subtle.verify !== "function") {
      throw new Error("Webhook signature verification is only supported when the `crypto` global is defined");
    }
    __classPrivateFieldGet(this, _Webhooks_instances, "m", _Webhooks_validateSecret).call(this, secret);
    const headersObj = buildHeaders([headers]).values;
    const signatureHeader = __classPrivateFieldGet(this, _Webhooks_instances, "m", _Webhooks_getRequiredHeader).call(this, headersObj, "webhook-signature");
    const timestamp2 = __classPrivateFieldGet(this, _Webhooks_instances, "m", _Webhooks_getRequiredHeader).call(this, headersObj, "webhook-timestamp");
    const webhookId = __classPrivateFieldGet(this, _Webhooks_instances, "m", _Webhooks_getRequiredHeader).call(this, headersObj, "webhook-id");
    const timestampSeconds = parseInt(timestamp2, 10);
    if (isNaN(timestampSeconds)) {
      throw new InvalidWebhookSignatureError("Invalid webhook timestamp format");
    }
    const nowSeconds = Math.floor(Date.now() / 1e3);
    if (nowSeconds - timestampSeconds > tolerance) {
      throw new InvalidWebhookSignatureError("Webhook timestamp is too old");
    }
    if (timestampSeconds > nowSeconds + tolerance) {
      throw new InvalidWebhookSignatureError("Webhook timestamp is too new");
    }
    const signatures = signatureHeader.split(" ").map((part) => part.startsWith("v1,") ? part.substring(3) : part);
    const decodedSecret = secret.startsWith("whsec_") ? Buffer.from(secret.replace("whsec_", ""), "base64") : Buffer.from(secret, "utf-8");
    const signedPayload = webhookId ? `${webhookId}.${timestamp2}.${payload}` : `${timestamp2}.${payload}`;
    const key = await crypto.subtle.importKey("raw", decodedSecret, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    for (const signature of signatures) {
      try {
        const signatureBytes = Buffer.from(signature, "base64");
        const isValid2 = await crypto.subtle.verify("HMAC", key, signatureBytes, new TextEncoder().encode(signedPayload));
        if (isValid2) {
          return;
        }
      } catch {
        continue;
      }
    }
    throw new InvalidWebhookSignatureError("The given webhook signature does not match the expected signature");
  }
};
_Webhooks_instances = /* @__PURE__ */ new WeakSet(), _Webhooks_validateSecret = function _Webhooks_validateSecret2(secret) {
  if (typeof secret !== "string" || secret.length === 0) {
    throw new Error(`The webhook secret must either be set using the env var, OPENAI_WEBHOOK_SECRET, on the client class, OpenAI({ webhookSecret: '123' }), or passed to this function`);
  }
}, _Webhooks_getRequiredHeader = function _Webhooks_getRequiredHeader2(headers, name) {
  if (!headers) {
    throw new Error(`Headers are required`);
  }
  const value = headers.get(name);
  if (value === null || value === void 0) {
    throw new Error(`Missing required header: ${name}`);
  }
  return value;
};

// node_modules/openai/client.mjs
var _OpenAI_instances;
var _a2;
var _OpenAI_encoder;
var _OpenAI_baseURLOverridden;
var OpenAI = class {
  /**
   * API Client for interfacing with the OpenAI API.
   *
   * @param {string | undefined} [opts.apiKey=process.env['OPENAI_API_KEY'] ?? undefined]
   * @param {string | null | undefined} [opts.organization=process.env['OPENAI_ORG_ID'] ?? null]
   * @param {string | null | undefined} [opts.project=process.env['OPENAI_PROJECT_ID'] ?? null]
   * @param {string | null | undefined} [opts.webhookSecret=process.env['OPENAI_WEBHOOK_SECRET'] ?? null]
   * @param {string} [opts.baseURL=process.env['OPENAI_BASE_URL'] ?? https://api.openai.com/v1] - Override the default base URL for the API.
   * @param {number} [opts.timeout=10 minutes] - The maximum amount of time (in milliseconds) the client will wait for a response before timing out.
   * @param {MergedRequestInit} [opts.fetchOptions] - Additional `RequestInit` options to be passed to `fetch` calls.
   * @param {Fetch} [opts.fetch] - Specify a custom `fetch` function implementation.
   * @param {number} [opts.maxRetries=2] - The maximum number of times the client will retry a request.
   * @param {HeadersLike} opts.defaultHeaders - Default headers to include with every request to the API.
   * @param {Record<string, string | undefined>} opts.defaultQuery - Default query parameters to include with every request to the API.
   * @param {boolean} [opts.dangerouslyAllowBrowser=false] - By default, client-side use of this library is not allowed, as it risks exposing your secret API credentials to attackers.
   */
  constructor({ baseURL = readEnv("OPENAI_BASE_URL"), apiKey = readEnv("OPENAI_API_KEY"), organization = readEnv("OPENAI_ORG_ID") ?? null, project = readEnv("OPENAI_PROJECT_ID") ?? null, webhookSecret = readEnv("OPENAI_WEBHOOK_SECRET") ?? null, ...opts } = {}) {
    _OpenAI_instances.add(this);
    _OpenAI_encoder.set(this, void 0);
    this.completions = new Completions2(this);
    this.chat = new Chat(this);
    this.embeddings = new Embeddings(this);
    this.files = new Files2(this);
    this.images = new Images(this);
    this.audio = new Audio(this);
    this.moderations = new Moderations(this);
    this.models = new Models(this);
    this.fineTuning = new FineTuning(this);
    this.graders = new Graders2(this);
    this.vectorStores = new VectorStores(this);
    this.webhooks = new Webhooks(this);
    this.beta = new Beta(this);
    this.batches = new Batches(this);
    this.uploads = new Uploads(this);
    this.responses = new Responses(this);
    this.realtime = new Realtime2(this);
    this.conversations = new Conversations(this);
    this.evals = new Evals(this);
    this.containers = new Containers(this);
    this.videos = new Videos(this);
    if (apiKey === void 0) {
      throw new OpenAIError("Missing credentials. Please pass an `apiKey`, or set the `OPENAI_API_KEY` environment variable.");
    }
    const options = {
      apiKey,
      organization,
      project,
      webhookSecret,
      ...opts,
      baseURL: baseURL || `https://api.openai.com/v1`
    };
    if (!options.dangerouslyAllowBrowser && isRunningInBrowser()) {
      throw new OpenAIError("It looks like you're running in a browser-like environment.\n\nThis is disabled by default, as it risks exposing your secret API credentials to attackers.\nIf you understand the risks and have appropriate mitigations in place,\nyou can set the `dangerouslyAllowBrowser` option to `true`, e.g.,\n\nnew OpenAI({ apiKey, dangerouslyAllowBrowser: true });\n\nhttps://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety\n");
    }
    this.baseURL = options.baseURL;
    this.timeout = options.timeout ?? _a2.DEFAULT_TIMEOUT;
    this.logger = options.logger ?? console;
    const defaultLogLevel = "warn";
    this.logLevel = defaultLogLevel;
    this.logLevel = parseLogLevel(options.logLevel, "ClientOptions.logLevel", this) ?? parseLogLevel(readEnv("OPENAI_LOG"), "process.env['OPENAI_LOG']", this) ?? defaultLogLevel;
    this.fetchOptions = options.fetchOptions;
    this.maxRetries = options.maxRetries ?? 2;
    this.fetch = options.fetch ?? getDefaultFetch();
    __classPrivateFieldSet(this, _OpenAI_encoder, FallbackEncoder, "f");
    this._options = options;
    this.apiKey = typeof apiKey === "string" ? apiKey : "Missing Key";
    this.organization = organization;
    this.project = project;
    this.webhookSecret = webhookSecret;
  }
  /**
   * Create a new client instance re-using the same options given to the current client with optional overriding.
   */
  withOptions(options) {
    const client = new this.constructor({
      ...this._options,
      baseURL: this.baseURL,
      maxRetries: this.maxRetries,
      timeout: this.timeout,
      logger: this.logger,
      logLevel: this.logLevel,
      fetch: this.fetch,
      fetchOptions: this.fetchOptions,
      apiKey: this.apiKey,
      organization: this.organization,
      project: this.project,
      webhookSecret: this.webhookSecret,
      ...options
    });
    return client;
  }
  defaultQuery() {
    return this._options.defaultQuery;
  }
  validateHeaders({ values, nulls }) {
    return;
  }
  async authHeaders(opts) {
    return buildHeaders([{ Authorization: `Bearer ${this.apiKey}` }]);
  }
  stringifyQuery(query) {
    return stringify(query, { arrayFormat: "brackets" });
  }
  getUserAgent() {
    return `${this.constructor.name}/JS ${VERSION}`;
  }
  defaultIdempotencyKey() {
    return `stainless-node-retry-${uuid4()}`;
  }
  makeStatusError(status, error, message, headers) {
    return APIError.generate(status, error, message, headers);
  }
  async _callApiKey() {
    const apiKey = this._options.apiKey;
    if (typeof apiKey !== "function")
      return false;
    let token;
    try {
      token = await apiKey();
    } catch (err) {
      if (err instanceof OpenAIError)
        throw err;
      throw new OpenAIError(
        `Failed to get token from 'apiKey' function: ${err.message}`,
        // @ts-ignore
        { cause: err }
      );
    }
    if (typeof token !== "string" || !token) {
      throw new OpenAIError(`Expected 'apiKey' function argument to return a string but it returned ${token}`);
    }
    this.apiKey = token;
    return true;
  }
  buildURL(path2, query, defaultBaseURL) {
    const baseURL = !__classPrivateFieldGet(this, _OpenAI_instances, "m", _OpenAI_baseURLOverridden).call(this) && defaultBaseURL || this.baseURL;
    const url = isAbsoluteURL(path2) ? new URL(path2) : new URL(baseURL + (baseURL.endsWith("/") && path2.startsWith("/") ? path2.slice(1) : path2));
    const defaultQuery = this.defaultQuery();
    if (!isEmptyObj(defaultQuery)) {
      query = { ...defaultQuery, ...query };
    }
    if (typeof query === "object" && query && !Array.isArray(query)) {
      url.search = this.stringifyQuery(query);
    }
    return url.toString();
  }
  /**
   * Used as a callback for mutating the given `FinalRequestOptions` object.
   */
  async prepareOptions(options) {
    await this._callApiKey();
  }
  /**
   * Used as a callback for mutating the given `RequestInit` object.
   *
   * This is useful for cases where you want to add certain headers based off of
   * the request properties, e.g. `method` or `url`.
   */
  async prepareRequest(request, { url, options }) {
  }
  get(path2, opts) {
    return this.methodRequest("get", path2, opts);
  }
  post(path2, opts) {
    return this.methodRequest("post", path2, opts);
  }
  patch(path2, opts) {
    return this.methodRequest("patch", path2, opts);
  }
  put(path2, opts) {
    return this.methodRequest("put", path2, opts);
  }
  delete(path2, opts) {
    return this.methodRequest("delete", path2, opts);
  }
  methodRequest(method, path2, opts) {
    return this.request(Promise.resolve(opts).then((opts2) => {
      return { method, path: path2, ...opts2 };
    }));
  }
  request(options, remainingRetries = null) {
    return new APIPromise(this, this.makeRequest(options, remainingRetries, void 0));
  }
  async makeRequest(optionsInput, retriesRemaining, retryOfRequestLogID) {
    const options = await optionsInput;
    const maxRetries = options.maxRetries ?? this.maxRetries;
    if (retriesRemaining == null) {
      retriesRemaining = maxRetries;
    }
    await this.prepareOptions(options);
    const { req, url, timeout } = await this.buildRequest(options, {
      retryCount: maxRetries - retriesRemaining
    });
    await this.prepareRequest(req, { url, options });
    const requestLogID = "log_" + (Math.random() * (1 << 24) | 0).toString(16).padStart(6, "0");
    const retryLogStr = retryOfRequestLogID === void 0 ? "" : `, retryOf: ${retryOfRequestLogID}`;
    const startTime = Date.now();
    loggerFor(this).debug(`[${requestLogID}] sending request`, formatRequestDetails({
      retryOfRequestLogID,
      method: options.method,
      url,
      options,
      headers: req.headers
    }));
    if (options.signal?.aborted) {
      throw new APIUserAbortError();
    }
    const controller = new AbortController();
    const response = await this.fetchWithTimeout(url, req, timeout, controller).catch(castToError);
    const headersTime = Date.now();
    if (response instanceof globalThis.Error) {
      const retryMessage = `retrying, ${retriesRemaining} attempts remaining`;
      if (options.signal?.aborted) {
        throw new APIUserAbortError();
      }
      const isTimeout = isAbortError(response) || /timed? ?out/i.test(String(response) + ("cause" in response ? String(response.cause) : ""));
      if (retriesRemaining) {
        loggerFor(this).info(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} - ${retryMessage}`);
        loggerFor(this).debug(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} (${retryMessage})`, formatRequestDetails({
          retryOfRequestLogID,
          url,
          durationMs: headersTime - startTime,
          message: response.message
        }));
        return this.retryRequest(options, retriesRemaining, retryOfRequestLogID ?? requestLogID);
      }
      loggerFor(this).info(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} - error; no more retries left`);
      loggerFor(this).debug(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} (error; no more retries left)`, formatRequestDetails({
        retryOfRequestLogID,
        url,
        durationMs: headersTime - startTime,
        message: response.message
      }));
      if (isTimeout) {
        throw new APIConnectionTimeoutError();
      }
      throw new APIConnectionError({ cause: response });
    }
    const specialHeaders = [...response.headers.entries()].filter(([name]) => name === "x-request-id").map(([name, value]) => ", " + name + ": " + JSON.stringify(value)).join("");
    const responseInfo = `[${requestLogID}${retryLogStr}${specialHeaders}] ${req.method} ${url} ${response.ok ? "succeeded" : "failed"} with status ${response.status} in ${headersTime - startTime}ms`;
    if (!response.ok) {
      const shouldRetry = await this.shouldRetry(response);
      if (retriesRemaining && shouldRetry) {
        const retryMessage2 = `retrying, ${retriesRemaining} attempts remaining`;
        await CancelReadableStream(response.body);
        loggerFor(this).info(`${responseInfo} - ${retryMessage2}`);
        loggerFor(this).debug(`[${requestLogID}] response error (${retryMessage2})`, formatRequestDetails({
          retryOfRequestLogID,
          url: response.url,
          status: response.status,
          headers: response.headers,
          durationMs: headersTime - startTime
        }));
        return this.retryRequest(options, retriesRemaining, retryOfRequestLogID ?? requestLogID, response.headers);
      }
      const retryMessage = shouldRetry ? `error; no more retries left` : `error; not retryable`;
      loggerFor(this).info(`${responseInfo} - ${retryMessage}`);
      const errText = await response.text().catch((err2) => castToError(err2).message);
      const errJSON = safeJSON(errText);
      const errMessage = errJSON ? void 0 : errText;
      loggerFor(this).debug(`[${requestLogID}] response error (${retryMessage})`, formatRequestDetails({
        retryOfRequestLogID,
        url: response.url,
        status: response.status,
        headers: response.headers,
        message: errMessage,
        durationMs: Date.now() - startTime
      }));
      const err = this.makeStatusError(response.status, errJSON, errMessage, response.headers);
      throw err;
    }
    loggerFor(this).info(responseInfo);
    loggerFor(this).debug(`[${requestLogID}] response start`, formatRequestDetails({
      retryOfRequestLogID,
      url: response.url,
      status: response.status,
      headers: response.headers,
      durationMs: headersTime - startTime
    }));
    return { response, options, controller, requestLogID, retryOfRequestLogID, startTime };
  }
  getAPIList(path2, Page2, opts) {
    return this.requestAPIList(Page2, { method: "get", path: path2, ...opts });
  }
  requestAPIList(Page2, options) {
    const request = this.makeRequest(options, null, void 0);
    return new PagePromise(this, request, Page2);
  }
  async fetchWithTimeout(url, init, ms, controller) {
    const { signal, method, ...options } = init || {};
    if (signal)
      signal.addEventListener("abort", () => controller.abort());
    const timeout = setTimeout(() => controller.abort(), ms);
    const isReadableBody = globalThis.ReadableStream && options.body instanceof globalThis.ReadableStream || typeof options.body === "object" && options.body !== null && Symbol.asyncIterator in options.body;
    const fetchOptions = {
      signal: controller.signal,
      ...isReadableBody ? { duplex: "half" } : {},
      method: "GET",
      ...options
    };
    if (method) {
      fetchOptions.method = method.toUpperCase();
    }
    try {
      return await this.fetch.call(void 0, url, fetchOptions);
    } finally {
      clearTimeout(timeout);
    }
  }
  async shouldRetry(response) {
    const shouldRetryHeader = response.headers.get("x-should-retry");
    if (shouldRetryHeader === "true")
      return true;
    if (shouldRetryHeader === "false")
      return false;
    if (response.status === 408)
      return true;
    if (response.status === 409)
      return true;
    if (response.status === 429)
      return true;
    if (response.status >= 500)
      return true;
    return false;
  }
  async retryRequest(options, retriesRemaining, requestLogID, responseHeaders) {
    let timeoutMillis;
    const retryAfterMillisHeader = responseHeaders?.get("retry-after-ms");
    if (retryAfterMillisHeader) {
      const timeoutMs = parseFloat(retryAfterMillisHeader);
      if (!Number.isNaN(timeoutMs)) {
        timeoutMillis = timeoutMs;
      }
    }
    const retryAfterHeader = responseHeaders?.get("retry-after");
    if (retryAfterHeader && !timeoutMillis) {
      const timeoutSeconds = parseFloat(retryAfterHeader);
      if (!Number.isNaN(timeoutSeconds)) {
        timeoutMillis = timeoutSeconds * 1e3;
      } else {
        timeoutMillis = Date.parse(retryAfterHeader) - Date.now();
      }
    }
    if (!(timeoutMillis && 0 <= timeoutMillis && timeoutMillis < 60 * 1e3)) {
      const maxRetries = options.maxRetries ?? this.maxRetries;
      timeoutMillis = this.calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries);
    }
    await sleep(timeoutMillis);
    return this.makeRequest(options, retriesRemaining - 1, requestLogID);
  }
  calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries) {
    const initialRetryDelay = 0.5;
    const maxRetryDelay = 8;
    const numRetries = maxRetries - retriesRemaining;
    const sleepSeconds = Math.min(initialRetryDelay * Math.pow(2, numRetries), maxRetryDelay);
    const jitter = 1 - Math.random() * 0.25;
    return sleepSeconds * jitter * 1e3;
  }
  async buildRequest(inputOptions, { retryCount = 0 } = {}) {
    const options = { ...inputOptions };
    const { method, path: path2, query, defaultBaseURL } = options;
    const url = this.buildURL(path2, query, defaultBaseURL);
    if ("timeout" in options)
      validatePositiveInteger("timeout", options.timeout);
    options.timeout = options.timeout ?? this.timeout;
    const { bodyHeaders, body } = this.buildBody({ options });
    const reqHeaders = await this.buildHeaders({ options: inputOptions, method, bodyHeaders, retryCount });
    const req = {
      method,
      headers: reqHeaders,
      ...options.signal && { signal: options.signal },
      ...globalThis.ReadableStream && body instanceof globalThis.ReadableStream && { duplex: "half" },
      ...body && { body },
      ...this.fetchOptions ?? {},
      ...options.fetchOptions ?? {}
    };
    return { req, url, timeout: options.timeout };
  }
  async buildHeaders({ options, method, bodyHeaders, retryCount }) {
    let idempotencyHeaders = {};
    if (this.idempotencyHeader && method !== "get") {
      if (!options.idempotencyKey)
        options.idempotencyKey = this.defaultIdempotencyKey();
      idempotencyHeaders[this.idempotencyHeader] = options.idempotencyKey;
    }
    const headers = buildHeaders([
      idempotencyHeaders,
      {
        Accept: "application/json",
        "User-Agent": this.getUserAgent(),
        "X-Stainless-Retry-Count": String(retryCount),
        ...options.timeout ? { "X-Stainless-Timeout": String(Math.trunc(options.timeout / 1e3)) } : {},
        ...getPlatformHeaders(),
        "OpenAI-Organization": this.organization,
        "OpenAI-Project": this.project
      },
      await this.authHeaders(options),
      this._options.defaultHeaders,
      bodyHeaders,
      options.headers
    ]);
    this.validateHeaders(headers);
    return headers.values;
  }
  buildBody({ options: { body, headers: rawHeaders } }) {
    if (!body) {
      return { bodyHeaders: void 0, body: void 0 };
    }
    const headers = buildHeaders([rawHeaders]);
    if (
      // Pass raw type verbatim
      ArrayBuffer.isView(body) || body instanceof ArrayBuffer || body instanceof DataView || typeof body === "string" && // Preserve legacy string encoding behavior for now
      headers.values.has("content-type") || // `Blob` is superset of `File`
      globalThis.Blob && body instanceof globalThis.Blob || // `FormData` -> `multipart/form-data`
      body instanceof FormData || // `URLSearchParams` -> `application/x-www-form-urlencoded`
      body instanceof URLSearchParams || // Send chunked stream (each chunk has own `length`)
      globalThis.ReadableStream && body instanceof globalThis.ReadableStream
    ) {
      return { bodyHeaders: void 0, body };
    } else if (typeof body === "object" && (Symbol.asyncIterator in body || Symbol.iterator in body && "next" in body && typeof body.next === "function")) {
      return { bodyHeaders: void 0, body: ReadableStreamFrom(body) };
    } else {
      return __classPrivateFieldGet(this, _OpenAI_encoder, "f").call(this, { body, headers });
    }
  }
};
_a2 = OpenAI, _OpenAI_encoder = /* @__PURE__ */ new WeakMap(), _OpenAI_instances = /* @__PURE__ */ new WeakSet(), _OpenAI_baseURLOverridden = function _OpenAI_baseURLOverridden2() {
  return this.baseURL !== "https://api.openai.com/v1";
};
OpenAI.OpenAI = _a2;
OpenAI.DEFAULT_TIMEOUT = 6e5;
OpenAI.OpenAIError = OpenAIError;
OpenAI.APIError = APIError;
OpenAI.APIConnectionError = APIConnectionError;
OpenAI.APIConnectionTimeoutError = APIConnectionTimeoutError;
OpenAI.APIUserAbortError = APIUserAbortError;
OpenAI.NotFoundError = NotFoundError;
OpenAI.ConflictError = ConflictError;
OpenAI.RateLimitError = RateLimitError;
OpenAI.BadRequestError = BadRequestError;
OpenAI.AuthenticationError = AuthenticationError;
OpenAI.InternalServerError = InternalServerError;
OpenAI.PermissionDeniedError = PermissionDeniedError;
OpenAI.UnprocessableEntityError = UnprocessableEntityError;
OpenAI.InvalidWebhookSignatureError = InvalidWebhookSignatureError;
OpenAI.toFile = toFile;
OpenAI.Completions = Completions2;
OpenAI.Chat = Chat;
OpenAI.Embeddings = Embeddings;
OpenAI.Files = Files2;
OpenAI.Images = Images;
OpenAI.Audio = Audio;
OpenAI.Moderations = Moderations;
OpenAI.Models = Models;
OpenAI.FineTuning = FineTuning;
OpenAI.Graders = Graders2;
OpenAI.VectorStores = VectorStores;
OpenAI.Webhooks = Webhooks;
OpenAI.Beta = Beta;
OpenAI.Batches = Batches;
OpenAI.Uploads = Uploads;
OpenAI.Responses = Responses;
OpenAI.Realtime = Realtime2;
OpenAI.Conversations = Conversations;
OpenAI.Evals = Evals;
OpenAI.Containers = Containers;
OpenAI.Videos = Videos;

// server/horoscope-cron.ts
var ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces"
];
function getHoroscopePeriod(type, date2) {
  const d = date2 || /* @__PURE__ */ new Date();
  const formatDate = (dt) => dt.toISOString().split("T")[0];
  if (type === "daily") {
    const dateStr = formatDate(d);
    return { start: dateStr, end: dateStr, label: d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) };
  } else if (type === "weekly") {
    const dayOfWeek = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: formatDate(monday),
      end: formatDate(sunday),
      label: `week beginning ${monday.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}`
    };
  } else {
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return {
      start: formatDate(firstDay),
      end: formatDate(lastDay),
      label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    };
  }
}
async function generateHoroscopeContent(sign, type, language, periodLabel, promptTemplate, aiModel) {
  const languageInstruction = language === "es" ? "Write the horoscope entirely in Spanish." : "Write the horoscope in English.";
  const typeLabel = type === "daily" ? "daily" : type === "weekly" ? "weekly" : "monthly";
  const fullPrompt = `${promptTemplate}

Zodiac Sign: ${sign}
Horoscope Type: ${typeLabel}
Period: ${periodLabel}
${languageInstruction}

Generate ONLY the horoscope text content for ${sign}. No title, no sign name, no labels \u2014 just the horoscope paragraph(s). Keep it engaging, personal, and specific to ${sign}'s traits.

OUTPUT FORMAT: Clean HTML only. Use <h2> tags for section headings (NOT markdown ## headings). Wrap all paragraphs in <p> tags. Do NOT use markdown formatting. No CSS, no classes, no inline styles. Only use <p>, <h2>, and <h3> tags.`;
  const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1"
  });
  const model = aiModel === "gpt" ? "openai/gpt-4o" : "anthropic/claude-sonnet-4-5";
  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: "user", content: fullPrompt }],
    max_tokens: type === "daily" ? 4096 : 8192,
    temperature: 0.85
  });
  let content = response.choices[0]?.message?.content?.trim() || "";
  content = content.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  content = content.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  content = content.replace(/^(?!<[hpo])((?!<).+)$/gm, "<p>$1</p>");
  return content;
}
var HOROSCOPE_SITES = ["psychicsource", "pathforward"];
async function runHoroscopeGeneration(type) {
  const languages = ["en", "es"];
  const daysToGenerate = type === "daily" ? [0, 1, 2, 3] : [0];
  for (const siteId of HOROSCOPE_SITES) {
    for (const lang of languages) {
      try {
        const prompt = await storage.getHoroscopePromptByTypeAndLanguage(type, lang, siteId);
        if (!prompt) {
          continue;
        }
        for (const dayOffset of daysToGenerate) {
          let targetDate;
          if (dayOffset > 0) {
            targetDate = /* @__PURE__ */ new Date();
            targetDate.setDate(targetDate.getDate() + dayOffset);
          }
          const period = getHoroscopePeriod(type, targetDate);
          const existing = await storage.getHoroscopeEntriesByPeriod(type, lang, period.start, siteId);
          if (existing.length > 0) {
            console.log(`[Horoscope Cron] ${type}/${lang}/${siteId} already generated for ${period.start}${dayOffset > 0 ? ` (+${dayOffset} days)` : ""}, skipping`);
            continue;
          }
          console.log(`[Horoscope Cron] Generating ${type} horoscopes in ${lang} for ${siteId} - ${period.label}${dayOffset > 0 ? ` (+${dayOffset} days)` : ""}...`);
          for (const sign of ZODIAC_SIGNS) {
            const content = await generateHoroscopeContent(
              sign,
              type,
              lang,
              period.label,
              prompt.prompt,
              prompt.aiModel || "claude"
            );
            await storage.createHoroscopeEntry({
              type,
              language: lang,
              site: siteId,
              sign,
              content,
              periodStart: period.start,
              periodEnd: period.end,
              status: "published"
            });
            console.log(`[Horoscope Cron] Generated ${sign} (${type}/${lang}/${siteId}) for ${period.start}`);
          }
          console.log(`[Horoscope Cron] Completed ${type}/${lang}/${siteId} for ${period.start}`);
        }
      } catch (error) {
        console.error(`[Horoscope Cron] Error generating ${type}/${lang}/${siteId}:`, error);
      }
    }
  }
}

// server/api-entries/cron-horoscopes.ts
async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const type = req.query.type || "daily";
  if (!["daily", "weekly", "monthly"].includes(type)) {
    return res.status(400).json({ error: "Invalid type. Must be daily, weekly, or monthly." });
  }
  try {
    console.log(`[Cron] Running ${type} horoscope generation...`);
    await runHoroscopeGeneration(type);
    res.json({ success: true, type });
  } catch (error) {
    console.error(`[Cron] Horoscope generation error:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
}
export {
  handler as default
};
