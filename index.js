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
      if (typeof headerContent === "string") {
        headerContent = [String(headerContent)];
      } else {
        headerContent = wrapChildChunk(compilation, headerContent);
      }
      if (typeof footerContent === "string") {
        footerContent = [String(footerContent)];
      } else {
        footerContent = wrapChildChunk(compilation, footerContent);
      }

      const concatedString = headerContent
        .concat(compilation.assets[fileName])
        .concat(footerContent);

      compilation.assets[fileName] = new ConcatSource(...concatedString);
    }

    function wrapChildChunk(compilation, { chunkName, header, footer }) {
      const childChunkFileName = calcChunkFileNameByName(
        compilation.chunks,
        chunkName
      );
      if (childChunkFileName) {
        var headerContent = header || "";
        var footerContent = footer || "";

        return [
          String(headerContent),
          compilation.assets[childChunkFileName],
          String(footerContent)
        ];
      }
      return [String("")];
    }

    function calcChunkFileNameByName(chunks, chunkName) {
      for (let i = 0, l = chunks.length; i < l; i++) {
        const chunk = chunks[i];
        if (chunk.name === chunkName) {
          return chunk.files[0];
        }
      }
      return "";
    }

    function wrapChunks(compilation, chunks, options) {
      chunks.forEach(function(chunk) {
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
        const tester = { test: option.test };
        if (ModuleFilenameHelpers.matchObject(tester, fileName)) {
          return option;
        }
      }
      return null;
    }
  }
}

module.exports = ChunksWrapperPlugin;
