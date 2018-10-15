"use strict";

const ConcatSource = require("webpack-sources/lib/ConcatSource");
const ModuleFilenameHelpers = require("webpack/lib/ModuleFilenameHelpers");

/**
 * @param options
 * @param {Array} [{test: /regex/, header?: string, footer?: string}]
 * @constructor
 */

class ChunksWrapperPlugin {
  constructor(options) {
    if (Object.prototype.toString.call(options) !== "[object Array]") {
      throw new TypeError('Argument "options" must be an Array.');
    }
    this.options = options;
  }

  apply(compiler) {
    const { options } = this;

    compiler.plugin("compilation", function(compilation) {
      compilation.plugin("optimize-chunk-assets", function(chunks, done) {
        wrapChunks(compilation, chunks, options);
        done();
      });
    });

    function wrapFile(compilation, fileName, { header, footer }) {
      var headerContent = header || "";
      var footerContent = footer || "";

      compilation.assets[fileName] = new ConcatSource(
        String(headerContent),
        compilation.assets[fileName],
        String(footerContent)
      );
    }

    function wrapChunks(compilation, chunks, options) {
      chunks.forEach(chunk => {
        chunk.files.forEach(function(fileName) {
          const foundOption = findMatchTester(fileName, options);
          if (foundOption) {
            const { header, footer } = foundOption;
            wrapFile(compilation, fileName, { header, footer });
          }
        });
      });
    }

    function findMatchTester(fileName, options) {
      for (let i = 0, l = options.length; i < l; i++) {
        const option = options[i];
        const tester = option.test;
        if (ModuleFilenameHelpers.matchObject(tester, fileName)) {
          return option;
        }
      }
      return null;
    }
  }
}

module.exports = ChunksWrapperPlugin;
