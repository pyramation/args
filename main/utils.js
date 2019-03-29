"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.processPositionalArgs = exports.processFilteredArgs = exports.processArrayArgs = exports.validateArgs = exports.processArgPaths = exports.processArgs = exports.getMinimistOpts = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var parseType = function parseType(m, type, question) {
  if (type === 'string') {
    m.string.push(question.name);
  } else if (type === 'path') {
    m.string.push(question.name);
  } else if (type === 'boolean') {
    m.boolean.push(question.name);
  } else if (type === 'array') {
    return parseType(m, question.items.type, question);
  }

  return m;
};

var getMinimistOpts = function getMinimistOpts(questions) {
  return questions.reduce(function (m, question) {
    if (question.hasOwnProperty('alias')) {
      m.alias[question.alias] = question.name;
    }

    return parseType(m, question.type, question);
  }, {
    alias: {},
    boolean: [],
    string: []
  });
};

exports.getMinimistOpts = getMinimistOpts;

var processPositionalArgs = function processPositionalArgs() {
  var questions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var argv = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    _: []
  };

  var _questions = questions.filter(function (q) {
    return q.hasOwnProperty('_') && typeof argv[q.name] === 'undefined';
  });

  var types = _questions.map(function (q) {
    return q.type;
  });

  var arrayOccurences = types.reduce(function (m, v) {
    return v === 'array' ? m + 1 : m;
  }, 0);

  if (arrayOccurences > 1) {
    throw new Error('cannot have more than one array');
  }

  var argLength = argv._.length;
  var len = types.length - arrayOccurences;
  var args = types.map(function (q) {
    return q === 'array' ? Math.max(1, argLength - len) : 1;
  });
  var ranges = args.reduce(function (m, v, i) {
    return i === 0 ? m.concat([[0, v]]) : m.concat([[m[i - 1][1], m[i - 1][1] + v]]);
  }, []);
  var max = ranges.length ? ranges[ranges.length - 1][1] : 0; // if (max < argv._.length)  /* too many positional arguments */
  // else if (max > argv._.length) /* not enough positional arguments */

  var arr = argv._.splice(0, max);

  ranges.forEach(function (range, i) {
    var question = _questions[i];
    var value = Array.prototype.slice.apply(arr, range);
    argv[question.name] = question.type === 'array' ? value : value[0];
  });
  return argv;
};

exports.processPositionalArgs = processPositionalArgs;

var processFilteredArgs = function processFilteredArgs() {
  var questions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var argv = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    _: []
  };
  // now run the filter command if on any questions
  questions.filter(function (q) {
    return q.hasOwnProperty('filter') && typeof q.filter === 'function';
  }).forEach(function (question) {
    argv[question.name] = argv[question.name] instanceof Array ? argv[question.name].map(question.filter) : question.filter(argv[question.name]);
  });
  return argv;
};

exports.processFilteredArgs = processFilteredArgs;

var processArrayArgs = function processArrayArgs() {
  var questions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var argv = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    _: []
  };
  //  arrays here
  questions.filter(function (q) {
    return q.type === 'array';
  }).forEach(function (question) {
    argv[question.name] = argv[question.name] instanceof Array ? argv[question.name] : [argv[question.name]];
  });
  return argv;
};

exports.processArrayArgs = processArrayArgs;

var processDefaultArgs = function processDefaultArgs() {
  var questions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var argv = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    _: []
  };
  //  defaults here
  questions.filter(function (q) {
    return typeof q.default !== 'undefined' || q.type === 'boolean';
  }).map(function (q) {
    return typeof q.default !== 'undefined' ? q : (0, _objectSpread2.default)({}, q, {
      default: false
    });
  }).forEach(function (question) {
    var n = question.name;
    argv[n] = argv[n] instanceof Array ? argv[n].length ? argv[n] : [question.default] : typeof argv[n] !== 'undefined' ? argv[n] : question.default;
  });
  return argv;
};

var processArgs = function processArgs() {
  var questions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var argv = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    _: []
  };
  processPositionalArgs(questions, argv);
  processDefaultArgs(questions, argv);
  processFilteredArgs(questions, argv);
  processArrayArgs(questions, argv);
  return argv;
};

exports.processArgs = processArgs;

var validateArgs = function validateArgs() {
  var questions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var argv = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    _: []
  };
  questions.filter(function (q) {
    return q.required;
  }).forEach(function (question) {
    if (typeof argv[question.name] === 'undefined') {
      throw new Error("".concat(question.name, " is required"));
    } else if (question.type === 'array') {
      if (argv[question.name] instanceof Array && !argv[question.name].length) {
        throw new Error("".concat(question.name, " is required"));
      }
    }
  });
}; // TODO get resolvePath via injector pattern


exports.validateArgs = validateArgs;

var resolvePath = function resolvePath(s) {
  return s;
};

var processArgPaths = function processArgPaths() {
  var questions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var argv = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    _: []
  };
  questions.filter(function (q) {
    return q.type === 'path' || q.type === 'array' && q.items.type === 'path';
  }).forEach(function (question) {
    argv[question.name] = question.type === 'array' ? argv[question.name].map(resolvePath) : argv[question.name] ? resolvePath(argv[question.name]) : undefined;
  });
  return argv;
};

exports.processArgPaths = processArgPaths;