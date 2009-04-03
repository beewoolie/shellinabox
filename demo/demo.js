// Demo.js -- Demonstrate some of the features of ShellInABox
// Copyright (C) 2008-2009 Markus Gutschke <markus@shellinabox.com>
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License version 2 as
// published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along
// with this program; if not, write to the Free Software Foundation, Inc.,
// 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
//
// In addition to these license terms, the author grants the following
// additional rights:
//
// If you modify this program, or any covered work, by linking or
// combining it with the OpenSSL project's OpenSSL library (or a
// modified version of that library), containing parts covered by the
// terms of the OpenSSL or SSLeay licenses, the author
// grants you additional permission to convey the resulting work.
// Corresponding Source for a non-source form of such a combination
// shall include the source code for the parts of OpenSSL used as well
// as that of the covered work.
//
// You may at your option choose to remove this additional permission from
// the work, or from any part of it.
//
// It is possible to build this program in a way that it loads OpenSSL
// libraries at run-time. If doing so, the following notices are required
// by the OpenSSL and SSLeay licenses:
//
// This product includes software developed by the OpenSSL Project
// for use in the OpenSSL Toolkit. (http://www.openssl.org/)
//
// This product includes cryptographic software written by Eric Young
// (eay@cryptsoft.com)
//
//
// The most up-to-date version of this program is always available from
// http://shellinabox.com
//
//
// Notes:
//
// The author believes that for the purposes of this license, you meet the
// requirements for publishing the source code, if your web server publishes
// the source in unmodified form (i.e. with licensing information, comments,
// formatting, and identifier names intact). If there are technical reasons
// that require you to make changes to the source code when serving the
// JavaScript (e.g to remove pre-processor directives from the source), these
// changes should be done in a reversible fashion.
//
// The author does not consider websites that reference this script in
// unmodified form, and web servers that serve this script in unmodified form
// to be derived works. As such, they are believed to be outside of the
// scope of this license and not subject to the rights or restrictions of the
// GNU General Public License.
//
// If in doubt, consult a legal professional familiar with the laws that
// apply in your country.

// #define STATE_IDLE     0
// #define STATE_INIT     1
// #define STATE_PROMPT   2
// #define STATE_READLINE 3
// #define STATE_COMMAND  4
// #define STATE_EVAL     5
// #define STATE_EXEC     6
// #define STATE_NEW_Y_N  7

// #define TYPE_STRING    0
// #define TYPE_NUMBER    1
// #define TYPE_VAR       2
// #define TYPE_STRVAR    3
// #define TYPE_INTVAR    4
// #define TYPE_ARR       5
// #define TYPE_STRARR    6
// #define TYPE_INTARR    7

function extend(subClass, baseClass) {
  function inheritance() { }
  inheritance.prototype          = baseClass.prototype;
  subClass.prototype             = new inheritance();
  subClass.prototype.constructor = subClass;
  subClass.prototype.superClass  = baseClass.prototype;
};

function Demo(container) {
  this.superClass.constructor.call(this, container);
  this.gotoState(1 /* STATE_INIT */);
};
extend(Demo, VT100);

Demo.prototype.keysPressed = function(ch) {
  if (this.state == 6 /* STATE_EXEC */) {
    for (var i = 0; i < ch.length; i++) {
      var c       = ch.charAt(i);
      if (c == '\u0003') {
        this.keys = '';
        this.error('Interrupted');
        return;
      }
    }
  }
  this.keys      += ch;
  this.gotoState(this.state);
};

Demo.prototype.gotoState = function(state, tmo) {
  this.state       = state;
  if (!this.timer || tmo) {
    if (!tmo) {
      tmo          = 1;
    }
    this.nextTimer = setTimeout(function(demo) {
                                  return function() {
                                    demo.demo();
                                  };
                                }(this), tmo);
  }
};

Demo.prototype.demo = function() {
  var done                  = false;
  this.nextTimer            = undefined;
  while (!done) {
    var state               = this.state;
    this.state              = 0 /* STATE_IDLE */;
    switch (state) {
    case 1 /* STATE_INIT */:
      done                  = this.doInit();
      break;
    case 2 /* STATE_PROMPT */:
      done                  = this.doPrompt();
      break;
    case 3 /* STATE_READLINE */:
      done                  = this.doReadLine();
      break;
    case 4 /* STATE_COMMAND */:
      done                  = this.doCommand();
      break;
    case 5 /* STATE_EVAL */:
      done                  = this.doEval();
      break;
    case 6 /* STATE_EXEC */:
      done                  = this.doExec();
      break;
    case 7 /* STATE_NEW_Y_N */:
      done                  = this.doNewYN();
      break;
    case 0 /* STATE_IDLE */:
    default:
      done                  = true;
      break;
    }
  }
  this.timer                = this.nextTimer;
  this.nextTimer            = undefined;
};

Demo.prototype.ok = function() {
  this.vt100('OK\r\n');
  this.gotoState(2 /* STATE_PROMPT */);
};

Demo.prototype.error = function(msg) {
  if (msg == undefined) {
    msg                 = 'Syntax Error';
  }
  this.vt100((this.cursorX != 0 ? '\r\n' : '') + '\u0007? ' + msg +
             (this.currentLineIndex >= 0 ?
              ' in line ' + this.program[this.evalLineIndex].lineNumber() :
              '') + '\r\n');
  this.gotoState(2 /* STATE_PROMPT */);
  this.currentLineIndex = -1;
  this.evalLineIndex    = -1;
  return undefined;
};

Demo.prototype.doInit = function() {
  this.program = new Array();
  this.vt100(
    '\u001Bc\u001B[34;4m' +
    'ShellInABox Demo Script\u001B[24;31m\r\n' +
    '\r\n' +
    'Copyright 2009 by Markus Gutschke <markus@shellinabox.com>\u001B[0m\r\n' +
    '\r\n' +
    '\r\n' +
    'This script simulates a minimal BASIC interpreter, allowing you to\r\n' +
    'experiment with the JavaScript terminal emulator that is part of\r\n' +
    'the ShellInABox project.\r\n' +
    '\r\n' +
    'Type HELP for a list of commands.\r\n' +
    '\r\n');
  this.gotoState(2 /* STATE_PROMPT */);
  return false;
};

Demo.prototype.doPrompt = function() {
  this.keys             = '';
  this.line             = '';
  this.currentLineIndex = -1;
  this.evalLineIndex    = -1;
  this.vt100((this.cursorX != 0 ? '\r\n' : '') + '> ');
  this.gotoState(3 /* STATE_READLINE */);
  return false;
};

Demo.prototype.doReadLine = function() {
  this.gotoState(3 /* STATE_READLINE */);
  var keys  = this.keys;
  this.keys = '';
  for (var i = 0; i < keys.length; i++) {
    var ch  = keys.charAt(i);
    if (ch >= ' ' && ch < '\u007F' || ch > '\u00A0') {
      this.line += ch;
      this.vt100(ch);
    } else if (ch == '\r' || ch == '\n') {
      this.vt100('\r\n');
      this.gotoState(4 /* STATE_COMMAND */);
      return false;
    } else if (ch == '\u0008' || ch == '\u007F') {
      if (this.line.length > 0) {
        this.line = this.line.substr(0, this.line.length - 1);
        if (this.cursorX == 0) {
          var x = this.terminalWidth - 1;
          var y = this.cursorY - 1;
          this.gotoXY(x, y);
          this.vt100(' ');
          this.gotoXY(x, y);
        } else {
          this.vt100('\u0008 \u0008');
        }
      } else {
        this.vt100('\u0007');
      }
    } else if (ch == '\u001B') {
      // This was probably a function key. Just eat all of the following keys.
      break;
    }
  }
  return true;
};

Demo.prototype.doCommand = function() {
  this.gotoState(2 /* STATE_PROMPT */);
  var tokens              = new this.Tokens(this.line);
  this.line               = '';
  var cmd                 = tokens.nextToken();
  if (cmd) {
    cmd                   = cmd;
    if (cmd.match(/^[0-9]+$/)) {
      tokens.removeLineNumber();
      var lineNumber        = parseInt(cmd);
      var index             = this.findLine(lineNumber);
      if (tokens.nextToken() == null) {
        if (index > 0) {
          // Delete line from program
          this.program.splice(index, 1);
        }
      } else {
        if (index >= 0) {
          // Replace line in program
          this.program[index].setTokens(tokens);
        } else {
          // Add new line to program
          this.program.splice(-index - 1, 0,
                              new this.Line(lineNumber, tokens));
        }
      }
    } else {
      this.currentLineIndex = -1;
      this.evalLineIndex    = -1;
      this.tokens           = tokens;
      this.gotoState(5 /* STATE_EVAL */);
    }
  }
  tokens.reset();
  return false;
};

Demo.prototype.doEval = function() {
  this.gotoState(2 /* STATE_PROMPT */);
  var token                 = this.tokens.nextToken();
  if (token == "HELP") {
    this.vt100('Supported commands:\r\n' +
               'ABS ASC ATN CHR$ COS EXP HELP INT LEFT$ LIST LEN LOG MID$\r\n'+
               'NEW POS PRINT RIGHT$ RND RUN SGN SIN SPC SQR STR$ TAB TAN\r\n'+
               'TI VAL\r\n');
  } else if (token == "LIST") {
    this.doList();
  } else if (token == "NEW") {
    if (this.currentLineIndex >= 0) {
      this.error('Cannot call NEW from a program');
    } else if (this.program.length == 0) {
      this.ok();
    } else {
      this.vt100('Do you really want to delete the program (y/N) ');
      this.gotoState(7 /* STATE_NEW_Y_N */);
    }
  } else if (token == "PRINT" || token == "?") {
    this.doPrint();
  } else if (token == "RUN") {
    if (this.tokens.peekToken() != null) {
      this.error('RUN does not take any parameters');
    } else if (this.program.length > 0) {
      this.currentLineIndex = 0;
      this.gotoState(6 /* STATE_EXEC */);
    } else {
      this.ok();
    }
  } else {
    this.error(token ? 'Unknown command: ' + token : undefined);
  }
  return false;
};

Demo.prototype.doList = function() {
  var start        = undefined;
  var stop         = undefined;
  var token        = this.tokens.nextToken();
  if (token) {
    if (token != '-' && !token.match(/[0-9]+/)) {
      return this.error('LIST can optional take a start and stop line number');
    }
    if (token != '-') {
      start        = parseInt(token);
      token        = this.tokens.nextToken();
    }
    if (!token) {
      stop         = start;
    } else {
      if (token != '-') {
        return this.error('Dash expected');
      }
      token        = this.tokens.nextToken();
      if (token) {
        if (!token.match(/[0-9]+/)) {
          return this.error(
                      'LIST can optionally take a start and stop line number');
        }
        stop       = parseInt(token);
        if (start && stop < start) {
          return this.error('Start line number has to come before stop');
        }
      }
      if (this.tokens.peekToken()) {
        return this.error('Unexpected trailing arguments');
      }
    }
  }

  var listed       = false;
  for (var i = 0; i < this.program.length; i++) {
    var line       = this.program[i];
    var lineNumber = line.lineNumber();
    if (start != undefined && start > lineNumber) {
      continue;
    }
    if (stop != undefined && stop < lineNumber) {
      break;
    }

    listed         = true;
    this.vt100('' + line.lineNumber() + ' ');
    line.tokens().reset();
    var space      = true;
    var id         = false;
    for (var token; (token = line.tokens().nextToken()) != null; ) {
      switch (token) {
        case '=':
        case '+':
        case '-':
        case '*':
        case '/':
        case '\\':
        case '^':
          this.vt100((space ? '' : ' ') + token + ' ');
          space    = true;
          id       = false;
          break;
        case '(':
        case ')':
        case '?':
        case '$':
        case '%':
        case '#':
          this.vt100(token);
          space    = false;
          id       = false;
          break;
        case ',':
        case ';':
        case ':':
          this.vt100(token + ' ');
          space    = true;
          id       = false;
          break;
        default:
          this.vt100((id ? ' ' : '') + token);
          space    = false;
          id       = true;
          break;
      }
    }
    this.vt100('\r\n');
  }
  if (!listed) {
    this.ok();
  }
};

Demo.prototype.doPrint = function() {
  var tokens    = this.tokens;
  var last      = undefined;
  for (var token; (token = tokens.peekToken()); ) {
    last        = token;
    if (token == ',') {
      this.vt100('\t');
      tokens.consume();
    } else if (token == ';') {
      // Do nothing
      tokens.consume();
    } else {
      var value = this.expr();
      if (value == undefined) {
        return;
      }
      this.vt100(value.toString());
    }
  }
  if (last != ';') {
    this.vt100('\r\n');
  }
};

Demo.prototype.doExec = function() {
  this.evalLineIndex = this.currentLineIndex++;
  this.tokens        = this.program[this.evalLineIndex].tokens();
  this.tokens.reset();
  this.doEval();
  if (this.currentLineIndex < 0) {
    return false;
  } else if (this.currentLineIndex >= this.program.length) {
    this.ok();
    return false;
  } else {
    this.gotoState(6 /* STATE_EXEC */, 20);
    return true;
  }
};

Demo.prototype.doNewYN = function() {
  for (var i = 0; i < this.keys.length; ) {
    var ch = this.keys.charAt(i++);
    if (ch == 'n' || ch == 'N' || ch == '\r' || ch == '\n') {
      this.vt100('N\r\n');
      this.keys = this.keys.substr(i);
      this.error('Aborted');
      return false;
    } else if (ch == 'y' || ch == 'Y') {
      this.vt100('Y\r\n');
      this.program.splice(0, this.program.length);
      this.keys = this.keys.substr(i);
      this.ok();
      return false;
    } else {
      this.vt100('\u0007');
    }
  }
  this.gotoState(7 /* STATE_NEW_Y_N */);
  return true;
};

Demo.prototype.findLine = function(lineNumber) {
  var l   = 0;
  var h   = this.program.length;
  while (h > l) {
    var m = Math.floor((l + h) / 2);
    var n = this.program[m].lineNumber();
    if (n == lineNumber) {
      return m;
    } else if (n > lineNumber) {
      h   = m;
    } else {
      l   = m + 1;
    }
  }
  return -l - 1;
};

Demo.prototype.expr = function() {
  var value   = this.term();
  while (value) {
    var token = this.tokens.peekToken();
    if (token != '+' && token != '-') {
      break;
    }
    this.tokens.consume();
    var v     = this.term();
    if (!v) {
      return v;
    }
    if (value.type() != v.type()) {
      if (value.type() != 0 /* TYPE_STRING */) {
        value = new this.Value(0 /* TYPE_STRING */, ''+value.val(), ''+value.val());
      }
      if (v.type() != 0 /* TYPE_STRING */) {
        v     = new this.Value(0 /* TYPE_STRING */, ''+v.val(), ''+v.val());
      }
    }
    if (token == '-') {
      if (value.type() == 0 /* TYPE_STRING */) {
        return this.error('Cannot subtract strings');
      }
      v       = value.val() - v.val();
    } else {
      v       = value.val() + v.val();
    }
    if (v == NaN) {
      return this.error('Numeric range error');
    }
    value     = new this.Value(value.type(), ''+v, v);
  }
  return value;
};

Demo.prototype.term = function() {
  var value   = this.expn();
  while (value) {
    var token = this.tokens.peekToken();
    if (token != '*' && token != '/' && token != '\\') {
      break;
    }
    this.tokens.consume();
    var v     = this.expn();
    if (!v) {
      return v;
    }
    if (value.type() != 1 /* TYPE_NUMBER */ || v.type() != 1 /* TYPE_NUMBER */) {
      return this.error('Cannot multiply or divide strings');
    }
    if (token == '*') {
      v       = value.val() * v.val();
    } else {
      v       = value.val() / v.val();
      if (token == '\\') {
        if (v < 0) {
          v   = -Math.floor(-v);
        } else {
          v   =  Math.floor( v);
        }
      }
    }
    if (v == NaN) {
      return this.error('Numeric range error');
    }
    value     = new this.Value(1 /* TYPE_NUMBER */, ''+v, v);
  }
  return value;
};

Demo.prototype.expn = function() {
  var value = this.intrinsic();
  var token = this.tokens.peekToken();
  if (token == '^') {
    this.tokens.consume();
    var exp = this.intrinsic();
    if (exp == undefined || exp.val() == NaN) {
      return exp;
    }
    if (value.type() != 1 /* TYPE_NUMBER */ || exp.type() != 1 /* TYPE_NUMBER */) {
      return this.error("Numeric value expected");
    }
    var v   = Math.pow(value.val(), exp.val());
    value   = new this.Value(1 /* TYPE_NUMBER */, '' + v, v);
  }
  return value;
};

Demo.prototype.intrinsic = function() {
  var token         = this.tokens.peekToken();
  var args          = undefined;
  var value, v, fnc, arg1, arg2, arg3;
  if (!token) {
    return this.error('Unexpected end of input');
  } else if (token.match(/^(?:ABS|ASC|ATN|CHR\$|COS|EXP|INT|LEN|LOG|POS|RND|SGN|SIN|SPC|SQR|STR\$|TAB|TAN|VAL)$/)) {
    fnc             = token;
    args            = 1;
  } else if (token.match(/^(?:LEFT\$|RIGHT\$)$/)) {
    fnc             = token;
    args            = 2;
  } else if (token == 'MID$') {
    fnc             = token;
    args            = 3;
  } else if (token == 'TI') {
    this.tokens.consume();
    v               = (new Date()).getTime() / 1000.0;
    return new this.Value(1 /* TYPE_NUMBER */, '' + v, v);
  } else {
    return this.factor();
  }
  this.tokens.consume();
  token             = this.tokens.nextToken();
  if (token != '(') {
    return this.error('"(" expected');
  }
  arg1              = this.expr();
  if (!arg1) {
    return arg1;
  }
  token             = this.tokens.nextToken();
  if (--args) {
    if (token != ',') {
      return this.error('"," expected');
    }
    arg2            = this.expr();
    if (!arg2) {
      return arg2;
    }
    token = this.tokens.nextToken();
    if (--args) {
      if (token != ',') {
        return this.error('"," expected');
      }
      arg3          = this.expr();
      if (!arg3) {
        return arg3;
      }
      token         = this.tokens.nextToken();
    }
  }
  if (token != ')') {
    return this.error('")" expected');
  }
  switch (fnc) {
  case 'ASC':
    if (arg1.type() != 0 /* TYPE_STRING */ || arg1.val().length < 1) {
      return this.error('Non-empty string expected');
    }
    v               = arg1.val().charCodeAt(0);
    value           = new this.Value(1 /* TYPE_NUMBER */, '' + v, v);
    break;
  case 'LEN':
    if (arg1.type() != 0 /* TYPE_STRING */) {
      return this.error('String expected');
    }
    v               = arg1.val().length;
    value           = new this.Value(1 /* TYPE_NUMBER */, '' + v, v);
    break;
  case 'LEFT$':
    if (arg1.type() != 0 /* TYPE_STRING */ || arg2.type() != 1 /* TYPE_NUMBER */ ||
        arg2.type() < 0) {
      return this.error('Invalid arguments');
    }
    v               = arg1.val().substr(0, Math.floor(arg2.val()));
    value           = new this.Value(0 /* TYPE_STRING */, v, v);
    break;
  case 'MID$':
    if (arg1.type() != 0 /* TYPE_STRING */ || arg2.type() != 1 /* TYPE_NUMBER */ ||
        arg3.type() != 1 /* TYPE_NUMBER */ || arg2.val() < 0 || arg3.val() < 0) {
      return this.error('Invalid arguments');
    }
    v               = arg1.val().substr(Math.floor(arg2.val()),
                                        Math.floor(arg3.val()));
    value           = new this.Value(0 /* TYPE_STRING */, v, v);
    break;
  case 'RIGHT$':
    if (arg1.type() != 0 /* TYPE_STRING */ || arg2.type() != 1 /* TYPE_NUMBER */ ||
        arg2.type() < 0) {
      return this.error('Invalid arguments');
    }
    v               = Math.floor(arg2.val());
    if (v > arg1.val().length) {
      v             = arg1.val().length;
    }
    v               = arg1.val().substr(arg1.val().length - v);
    value           = new this.Value(0 /* TYPE_STRING */, v, v);
    break;   
  case 'STR$':
    value           = new this.Value(0 /* TYPE_STRING */, arg1.toString(),
                                     arg1.toString());
    break;
  case 'VAL':
    if (arg1.type() == 1 /* TYPE_NUMBER */) {
      value         = arg1;
    } else {
      if (arg1.val().match(/^[0-9]+$/)) {
        v           = parseInt(arg1.val());
      } else {
        v           = parseFloat(arg1.val());
      }
      value         = new this.Value(1 /* TYPE_NUMBER */, '' + v, v);
    }
    break;
  default:
    if (arg1.type() != 1 /* TYPE_NUMBER */) {
      return this.error('Numeric value expected');
    }
    switch (fnc) {
    case 'CHR$':
      if (arg1.val() < 0 || arg1.val() > 65535) {
        return this.error('Invalid Unicode range');
      }
      v             = String.fromCharCode(arg1.val());
      value         = new this.Value(0 /* TYPE_STRING */, v, v);
      break;
    case 'SPC': 
      if (arg1.val() < 0) {
        return this.error('Range error');
      }
      v             = arg1.val() >= 1 ?
                      '\u001B[' + Math.floor(arg1.val()) + 'C' : '';
      value         = new this.Value(0 /* TYPE_STRING */, v, v);
      break;
    case 'TAB':
      if (arg1.val() < 0) {
        return this.error('Range error');
      }
      v             = '\r' + (arg1.val() >= 1 ?
                      '\u001B[' + (Math.floor(arg1.val())*8) + 'C' : '');
      value         = new this.Value(0 /* TYPE_STRING */, v, v);
      break;
    default:
      switch (fnc) {
      case 'ABS': v = Math.abs(arg1.val());                     break;
      case 'ATN': v = Math.atan(arg1.val());                    break;
      case 'COS': v = Math.cos(arg1.val());                     break;
      case 'EXP': v = Math.exp(arg1.val());                     break;
      case 'INT': v = Math.floor(arg1.val());                   break;
      case 'LOG': v = Math.log(arg1.val());                     break;
      case 'POS': v = this.cursorX;                             break;
      case 'SGN': v = arg1.val() < 0 ? -1 : arg1.val() ? 1 : 0; break;
      case 'SIN': v = Math.sin(arg1.val());                     break;
      case 'SQR': v = Math.sqrt(arg1.val());                    break;
      case 'TAN': v = Math.tan(arg1.val());                     break;
      case 'RND':
        if (this.prng == undefined) {
          this.prng = 1013904223;
        }
        if (arg1.type() == 1 /* TYPE_NUMBER */ && arg1.val() < 0) {
          this.prng = Math.floor(1664525*arg1.val()) & 0xFFFFFFFF;
        }
        if (arg1.type() != 1 /* TYPE_NUMBER */ || arg1.val() != 0) {
          this.prng = Math.floor(1664525*this.prng + 1013904223) &
                      0xFFFFFFFF;
        }
        v           = ((this.prng & 0x7FFFFFFF) / 65536.0) / 32768;
        break;
      }
      value         = new this.Value(1 /* TYPE_NUMBER */, '' + v, v);
    }
  }
  if (v == NaN) {
    return this.error('Numeric range error');
  }
  return value;
};

Demo.prototype.factor = function() {
  var token    = this.tokens.nextToken();
  var value;
  if (token == '-') {
    value      = this.expr();
    if (!value) {
      return value;
    }
    if (value.type() != 1 /* TYPE_NUMBER */) {
      return this.error('Numeric value expected');
    }
    return new this.Value(1 /* TYPE_NUMBER */, '' + -value.val(), -value.val());
  }
  if (!token) {
    return this.error();
  }
  if (token == '(') {
    value      = this.expr();
    token      = this.tokens.nextToken();
    if (token != ')' && value != undefined) {
      return this.error('")" expected');
    }
  } else {
    var str;
    if ((str = token.match(/^"(.*)"/)) != null) {
      value    = new this.Value(0 /* TYPE_STRING */, str[1], str[1]);
    } else if (token.match(/^[0-9]/)) {
      var number;
      if (token.match(/^[0-9]*$/)) {
        number = parseInt(token);
      } else {
        number = parseFloat(token);
      }
      if (number == NaN) {
        return this.error('Numeric range error');
      }
      value    = new this.Value(1 /* TYPE_NUMBER */, token, number);
    } else {
      return this.error();
    }
  }

  return value;
};

Demo.prototype.Tokens = function(line) {
  this.line   = line;
  this.tokens = line;
  this.len    = undefined;
};

Demo.prototype.Tokens.prototype.peekToken = function() {
  this.len      = undefined;
  this.tokens   = this.tokens.replace(/^[ \t]*/, '');
  var tokens    = this.tokens;
  if (!tokens.length) {
    return null;
  }
  var token     = tokens.charAt(0);
  switch (token) {
  case '<':
    if (tokens.length > 1) {
      if (tokens.charAt(1) == '>') {
        token   = '<>';
      } else if (tokens.charAt(1) == '=') {
        token   = '<=';
      }
    }
    break;
  case '>':
    if (tokens.charAt(1) == '=') {
      token     = '>=';
    }
    break;
  case '=':
  case '+':
  case '-':
  case '*':
  case '/':
  case '\\':
  case '^':
  case '(':
  case ')':
  case '?':
  case ',':
  case ';':
  case ':':
  case '$':
  case '%':
  case '#':
    break;
  case '"':
    token       = tokens.match(/"((?:""|[^"])*)"/); // "
    if (!token) {
      token     = undefined;
    } else {
      this.len  = token[0].length;
      token     = '"' + token[1].replace(/""/g, '"') + '"';
    }
    break;
  default:
    if (token >= '0' && token <= '9' || token == '.') {
      token     = tokens.match(/^[0-9]*(?:[.][0-9]*)?(?:[eE][-+]?[0-9]+)?/);
      if (!token) {
        token   = undefined;
      } else {
        token   = token[0];
      }
    } else if (token >= 'A' && token <= 'Z' ||
               token >= 'a' && token <= 'z') {
      token     = tokens.match(/^(?:CHR\$|STR\$|LEFT\$|RIGHT\$|MID\$)/i);
      if (token) {
        token   = token[0].toUpperCase();
      } else {
        token   = tokens.match(/^[A-Za-z][A-Za-z0-9_]*/);
        if (!token) {
          token = undefined;
        } else {
          token = token[0].toUpperCase();
        }
      }
    } else {
      token     = '';
    }
  }

  if (this.len == undefined) {
    if (token) {
      this.len  = token.length;
    } else {
      this.len  = 1;
    }
  }

  return token;
};

Demo.prototype.Tokens.prototype.consume = function() {
  if (this.len) {
    this.tokens = this.tokens.substr(this.len);
    this.len    = undefined;
  }
};

Demo.prototype.Tokens.prototype.nextToken = function() {
  var token = this.peekToken();
  this.consume();
  return token;
};

Demo.prototype.Tokens.prototype.removeLineNumber = function() {
  this.line = this.line.replace(/^[0-9]*[ \t]*/, '');
};

Demo.prototype.Tokens.prototype.reset = function() {
  this.tokens = this.line;
};

Demo.prototype.Line = function(lineNumber, tokens) {
  this.lineNumber_ = lineNumber;
  this.tokens_     = tokens;
};

Demo.prototype.Line.prototype.lineNumber = function() {
  return this.lineNumber_;
};

Demo.prototype.Line.prototype.tokens = function() {
  return this.tokens_;
};

Demo.prototype.Line.prototype.setTokens = function(tokens) {
  this.tokens_ = tokens;
};

Demo.prototype.Line.prototype.sort = function(a, b) {
  return a.lineNumber_ - b.lineNumber_;
};

Demo.prototype.Value = function(type, str, val) {
  this.t = type;
  this.s = str;
  this.v = val;
};

Demo.prototype.Value.prototype.type = function() {
  return this.t;
};

Demo.prototype.Value.prototype.val = function() {
  return this.v;
};

Demo.prototype.Value.prototype.toString = function() {
  return this.s;
};

