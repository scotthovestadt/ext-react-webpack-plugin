"use strict";

var _babylon = require("babylon");

var _astTraverse = _interopRequireDefault(require("ast-traverse"));

var _generator = _interopRequireDefault(require("@babel/generator"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const MODULE_PATTERN = /^@extjs\/(ext-react.*|reactor\/(classic|modern))$/;

function toXtype(str) {
  return str.toLowerCase().replace(/_/g, '-');
}
/**
 * Extracts Ext.create equivalents from jsx tags so that cmd knows which classes to include in the bundle
 * @param {String} js The javascript code
 * @param {Compilation} compilation The webpack compilation object
 * @returns {Array} An array of Ext.create statements
 */


module.exports = function extractFromJSX(js, compilation, module, reactVersion) {
  // var isFile = module.resource.includes("Home.js")
  // if(isFile) { 
  //   console.log(module.resource)
  //   console.log('****************') 
  //   console.log(js) 
  //   console.log('****************') 
  // }
  const statements = [];
  const types = {}; // Aliases used for reactify

  const reactifyAliases = new Set([]);
  const ast = (0, _babylon.parse)(js, {
    plugins: ['jsx', 'flow', 'doExpressions', 'objectRestSpread', 'classProperties', 'exportExtensions', 'asyncGenerators', 'functionBind', 'functionSent', 'dynamicImport'],
    sourceType: 'module'
  });
  /**
   * Adds a type mapping for a reactify call
   * @param {String} varName The name of the local variable being defined.
   * @param {Node} reactifyArgNode The argument passed to reactify()
   */

  function addType(varName, reactifyArgNode) {
    if (reactifyArgNode.type === 'StringLiteral') {
      types[varName] = {
        xtype: toXtype(reactifyArgNode.value)
      };
    } else {
      types[varName] = {
        xclass: js.slice(reactifyArgNode.start, reactifyArgNode.end)
      };
    }
  }

  (0, _astTraverse.default)(ast, {
    pre: function (node) {
      //if (node.type == 'ExpressionStatement') {
      // if(isFile) {
      //   console.log(node.type)
      //   console.log(JSON.stringify(node))
      // }
      if (node.type == 'ImportDeclaration') {
        //console.log(node.type)
        //console.log('node: ' + node.source.value)
        //console.log('option: ' + node.source.value)
        if (node.source.value.match(MODULE_PATTERN)) {
          //console.log('node: ' + node.source.value)
          // look for: import { Grid } from '@sencha/react-modern'
          for (let spec of node.specifiers) {
            types[spec.local.name] = {
              xtype: toXtype(spec.imported.name)
            };
          }
        } else if (node.source.value === `@extjs/reactor`) {
          // identify local names of reactify based on import { reactify as foo } from '@sencha/ext-react';
          for (let spec of node.specifiers) {
            if (spec.imported.name === 'reactify') {
              reactifyAliases.add(spec.local.name);
            }
          }
        }
      } // Look for reactify calls. Keep track of the names of each component so we can map JSX tags to xtypes and
      // convert props to configs so Sencha Cmd can discover automatic dependencies in the manifest.


      if (node.type == 'VariableDeclarator' && node.init && node.init.type === 'CallExpression' && node.init.callee && reactifyAliases.has(node.init.callee.name)) {
        //console.log(node.type)
        //console.log('VariableDeclarator')
        if (node.id.elements) {
          // example: const [ Panel, Grid ] = reactify('Panel', 'Grid');
          for (let i = 0; i < node.id.elements.length; i++) {
            const tagName = node.id.elements[i].name;
            if (!tagName) continue;
            const valueNode = node.init.arguments[i];
            if (!valueNode) continue;
            addType(tagName, valueNode);
          }
        } else {
          // example: const Grid = reactify('grid');
          const varName = node.id.name;
          const arg = node.init.arguments && node.init.arguments[0] && node.init.arguments[0];
          if (varName && arg) addType(varName, arg);
        }
      } // Convert React.createElement(...) calls to the equivalent Ext.create(...) calls to put in the manifest.


      if (node.type === 'CallExpression' && node.callee.object && node.callee.object.name === 'React' && node.callee.property.name === 'createElement') {
        //console.log(node.type)
        const [tag, props] = node.arguments;
        let type = types[tag.name];

        if (type) {
          let config;

          if (Array.isArray(props.properties)) {
            config = (0, _generator.default)(props).code;

            for (let key in type) {
              config = `{\n  ${key}: '${type[key]}',${config.slice(1)}`;
            }
          } else {
            config = JSON.stringify(type);
          }

          statements.push(`Ext.create(${config})`);
        }
      }
    }
  }); // ensure that all imported classes are present in the build even if they aren't used,
  // otherwise the call to reactify will fail

  for (let key in types) {
    statements.push(`Ext.create(${JSON.stringify(types[key])})`);
  } //console.log('\n\nstatements:')
  //console.log(statements)
  //console.log('\n\n')


  return statements;
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9leHRyYWN0RnJvbUpTWC5qcyJdLCJuYW1lcyI6WyJNT0RVTEVfUEFUVEVSTiIsInRvWHR5cGUiLCJzdHIiLCJ0b0xvd2VyQ2FzZSIsInJlcGxhY2UiLCJtb2R1bGUiLCJleHBvcnRzIiwiZXh0cmFjdEZyb21KU1giLCJqcyIsImNvbXBpbGF0aW9uIiwicmVhY3RWZXJzaW9uIiwic3RhdGVtZW50cyIsInR5cGVzIiwicmVhY3RpZnlBbGlhc2VzIiwiU2V0IiwiYXN0IiwicGx1Z2lucyIsInNvdXJjZVR5cGUiLCJhZGRUeXBlIiwidmFyTmFtZSIsInJlYWN0aWZ5QXJnTm9kZSIsInR5cGUiLCJ4dHlwZSIsInZhbHVlIiwieGNsYXNzIiwic2xpY2UiLCJzdGFydCIsImVuZCIsInByZSIsIm5vZGUiLCJzb3VyY2UiLCJtYXRjaCIsInNwZWMiLCJzcGVjaWZpZXJzIiwibG9jYWwiLCJuYW1lIiwiaW1wb3J0ZWQiLCJhZGQiLCJpbml0IiwiY2FsbGVlIiwiaGFzIiwiaWQiLCJlbGVtZW50cyIsImkiLCJsZW5ndGgiLCJ0YWdOYW1lIiwidmFsdWVOb2RlIiwiYXJndW1lbnRzIiwiYXJnIiwib2JqZWN0IiwicHJvcGVydHkiLCJ0YWciLCJwcm9wcyIsImNvbmZpZyIsIkFycmF5IiwiaXNBcnJheSIsInByb3BlcnRpZXMiLCJjb2RlIiwia2V5IiwiSlNPTiIsInN0cmluZ2lmeSIsInB1c2giXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBOztBQUNBOztBQUNBOzs7O0FBRUEsTUFBTUEsY0FBYyxHQUFHLG1EQUF2Qjs7QUFFQSxTQUFTQyxPQUFULENBQWlCQyxHQUFqQixFQUFzQjtBQUNsQixTQUFPQSxHQUFHLENBQUNDLFdBQUosR0FBa0JDLE9BQWxCLENBQTBCLElBQTFCLEVBQWdDLEdBQWhDLENBQVA7QUFDSDtBQUVEOzs7Ozs7OztBQU1BQyxNQUFNLENBQUNDLE9BQVAsR0FBaUIsU0FBU0MsY0FBVCxDQUF3QkMsRUFBeEIsRUFBNEJDLFdBQTVCLEVBQXlD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QUFJLENBQUNrQixTQUExQjtBQUNBLFlBQUkxQixJQUFJLEdBQUdULEtBQUssQ0FBQ3VDLEdBQUcsQ0FBQ2hCLElBQUwsQ0FBaEI7O0FBQ0EsWUFBSWQsSUFBSixFQUFVO0FBQ1IsY0FBSWdDLE1BQUo7O0FBQ0EsY0FBSUMsS0FBSyxDQUFDQyxPQUFOLENBQWNILEtBQUssQ0FBQ0ksVUFBcEIsQ0FBSixFQUFxQztBQUNqQ0gsWUFBQUEsTUFBTSxHQUFHLHdCQUFTRCxLQUFULEVBQWdCSyxJQUF6Qjs7QUFDQSxpQkFBSyxJQUFJQyxHQUFULElBQWdCckMsSUFBaEIsRUFBc0I7QUFDbEJnQyxjQUFBQSxNQUFNLEdBQUksUUFBT0ssR0FBSSxNQUFLckMsSUFBSSxDQUFDcUMsR0FBRCxDQUFNLEtBQUlMLE1BQU0sQ0FBQzVCLEtBQVAsQ0FBYSxDQUFiLENBQWdCLEVBQXhEO0FBQ0g7QUFDSixXQUxELE1BS087QUFDSDRCLFlBQUFBLE1BQU0sR0FBR00sSUFBSSxDQUFDQyxTQUFMLENBQWV2QyxJQUFmLENBQVQ7QUFDSDs7QUFDRFYsVUFBQUEsVUFBVSxDQUFDa0QsSUFBWCxDQUFpQixjQUFhUixNQUFPLEdBQXJDO0FBQ0Q7QUFDRjtBQUNGO0FBN0VTLEdBQWQsRUE1QzRFLENBNEg1RTtBQUNBOztBQUNBLE9BQUssSUFBSUssR0FBVCxJQUFnQjlDLEtBQWhCLEVBQXVCO0FBQ3JCRCxJQUFBQSxVQUFVLENBQUNrRCxJQUFYLENBQWlCLGNBQWFGLElBQUksQ0FBQ0MsU0FBTCxDQUFlaEQsS0FBSyxDQUFDOEMsR0FBRCxDQUFwQixDQUEyQixHQUF6RDtBQUNELEdBaEkyRSxDQWtJaEY7QUFDQTtBQUNBOzs7QUFFSSxTQUFPL0MsVUFBUDtBQUNILENBdklEIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG5cbmltcG9ydCB7IHBhcnNlIH0gZnJvbSAnYmFieWxvbic7XG5pbXBvcnQgdHJhdmVyc2UgZnJvbSAnYXN0LXRyYXZlcnNlJztcbmltcG9ydCBnZW5lcmF0ZSBmcm9tICdAYmFiZWwvZ2VuZXJhdG9yJztcblxuY29uc3QgTU9EVUxFX1BBVFRFUk4gPSAvXkBleHRqc1xcLyhleHQtcmVhY3QuKnxyZWFjdG9yXFwvKGNsYXNzaWN8bW9kZXJuKSkkLztcblxuZnVuY3Rpb24gdG9YdHlwZShzdHIpIHtcbiAgICByZXR1cm4gc3RyLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXy9nLCAnLScpO1xufVxuXG4vKipcbiAqIEV4dHJhY3RzIEV4dC5jcmVhdGUgZXF1aXZhbGVudHMgZnJvbSBqc3ggdGFncyBzbyB0aGF0IGNtZCBrbm93cyB3aGljaCBjbGFzc2VzIHRvIGluY2x1ZGUgaW4gdGhlIGJ1bmRsZVxuICogQHBhcmFtIHtTdHJpbmd9IGpzIFRoZSBqYXZhc2NyaXB0IGNvZGVcbiAqIEBwYXJhbSB7Q29tcGlsYXRpb259IGNvbXBpbGF0aW9uIFRoZSB3ZWJwYWNrIGNvbXBpbGF0aW9uIG9iamVjdFxuICogQHJldHVybnMge0FycmF5fSBBbiBhcnJheSBvZiBFeHQuY3JlYXRlIHN0YXRlbWVudHNcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBleHRyYWN0RnJvbUpTWChqcywgY29tcGlsYXRpb24sIG1vZHVsZSwgcmVhY3RWZXJzaW9uKSB7XG4gIC8vIHZhciBpc0ZpbGUgPSBtb2R1bGUucmVzb3VyY2UuaW5jbHVkZXMoXCJIb21lLmpzXCIpXG4gIC8vIGlmKGlzRmlsZSkgeyBcbiAgLy8gICBjb25zb2xlLmxvZyhtb2R1bGUucmVzb3VyY2UpXG4gIC8vICAgY29uc29sZS5sb2coJyoqKioqKioqKioqKioqKionKSBcbiAgLy8gICBjb25zb2xlLmxvZyhqcykgXG4gIC8vICAgY29uc29sZS5sb2coJyoqKioqKioqKioqKioqKionKSBcbiAgLy8gfVxuIFxuICAgIGNvbnN0IHN0YXRlbWVudHMgPSBbXTtcbiAgICBjb25zdCB0eXBlcyA9IHt9O1xuXG4gICAgLy8gQWxpYXNlcyB1c2VkIGZvciByZWFjdGlmeVxuICAgIGNvbnN0IHJlYWN0aWZ5QWxpYXNlcyA9IG5ldyBTZXQoW10pO1xuXG4gICAgY29uc3QgYXN0ID0gcGFyc2UoanMsIHtcbiAgICAgICAgcGx1Z2luczogW1xuICAgICAgICAgICAgJ2pzeCcsXG4gICAgICAgICAgICAnZmxvdycsXG4gICAgICAgICAgICAnZG9FeHByZXNzaW9ucycsXG4gICAgICAgICAgICAnb2JqZWN0UmVzdFNwcmVhZCcsXG4gICAgICAgICAgICAnY2xhc3NQcm9wZXJ0aWVzJyxcbiAgICAgICAgICAgICdleHBvcnRFeHRlbnNpb25zJyxcbiAgICAgICAgICAgICdhc3luY0dlbmVyYXRvcnMnLFxuICAgICAgICAgICAgJ2Z1bmN0aW9uQmluZCcsXG4gICAgICAgICAgICAnZnVuY3Rpb25TZW50JyxcbiAgICAgICAgICAgICdkeW5hbWljSW1wb3J0J1xuICAgICAgICBdLFxuICAgICAgICBzb3VyY2VUeXBlOiAnbW9kdWxlJ1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIHR5cGUgbWFwcGluZyBmb3IgYSByZWFjdGlmeSBjYWxsXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHZhck5hbWUgVGhlIG5hbWUgb2YgdGhlIGxvY2FsIHZhcmlhYmxlIGJlaW5nIGRlZmluZWQuXG4gICAgICogQHBhcmFtIHtOb2RlfSByZWFjdGlmeUFyZ05vZGUgVGhlIGFyZ3VtZW50IHBhc3NlZCB0byByZWFjdGlmeSgpXG4gICAgICovXG4gICAgZnVuY3Rpb24gYWRkVHlwZSh2YXJOYW1lLCByZWFjdGlmeUFyZ05vZGUpIHtcbiAgICAgICAgaWYgKHJlYWN0aWZ5QXJnTm9kZS50eXBlID09PSAnU3RyaW5nTGl0ZXJhbCcpIHtcbiAgICAgICAgICAgIHR5cGVzW3Zhck5hbWVdID0geyB4dHlwZTogdG9YdHlwZShyZWFjdGlmeUFyZ05vZGUudmFsdWUpIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0eXBlc1t2YXJOYW1lXSA9IHsgeGNsYXNzOiBqcy5zbGljZShyZWFjdGlmeUFyZ05vZGUuc3RhcnQsIHJlYWN0aWZ5QXJnTm9kZS5lbmQpIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0cmF2ZXJzZShhc3QsIHtcbiAgICAgICAgcHJlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgLy9pZiAobm9kZS50eXBlID09ICdFeHByZXNzaW9uU3RhdGVtZW50Jykge1xuICAgICAgICAgIC8vIGlmKGlzRmlsZSkge1xuICAgICAgICAgIC8vICAgY29uc29sZS5sb2cobm9kZS50eXBlKVxuICAgICAgICAgIC8vICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkobm9kZSkpXG4gICAgICAgICAgLy8gfVxuICAgICAgICAgIGlmIChub2RlLnR5cGUgPT0gJ0ltcG9ydERlY2xhcmF0aW9uJykge1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhub2RlLnR5cGUpXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdub2RlOiAnICsgbm9kZS5zb3VyY2UudmFsdWUpXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdvcHRpb246ICcgKyBub2RlLnNvdXJjZS52YWx1ZSlcblxuICAgICAgICAgICAgICBpZiAobm9kZS5zb3VyY2UudmFsdWUubWF0Y2goTU9EVUxFX1BBVFRFUk4pKSB7XG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnbm9kZTogJyArIG5vZGUuc291cmNlLnZhbHVlKVxuICAgICAgICAgICAgICAgIC8vIGxvb2sgZm9yOiBpbXBvcnQgeyBHcmlkIH0gZnJvbSAnQHNlbmNoYS9yZWFjdC1tb2Rlcm4nXG4gICAgICAgICAgICAgICAgICBmb3IgKGxldCBzcGVjIG9mIG5vZGUuc3BlY2lmaWVycykge1xuICAgICAgICAgICAgICAgICAgICAgIHR5cGVzW3NwZWMubG9jYWwubmFtZV0gPSB7IHh0eXBlOiB0b1h0eXBlKHNwZWMuaW1wb3J0ZWQubmFtZSkgfTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChub2RlLnNvdXJjZS52YWx1ZSA9PT0gYEBleHRqcy9yZWFjdG9yYCkge1xuICAgICAgICAgICAgICAgICAgLy8gaWRlbnRpZnkgbG9jYWwgbmFtZXMgb2YgcmVhY3RpZnkgYmFzZWQgb24gaW1wb3J0IHsgcmVhY3RpZnkgYXMgZm9vIH0gZnJvbSAnQHNlbmNoYS9leHQtcmVhY3QnO1xuICAgICAgICAgICAgICAgICAgZm9yIChsZXQgc3BlYyBvZiBub2RlLnNwZWNpZmllcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoc3BlYy5pbXBvcnRlZC5uYW1lID09PSAncmVhY3RpZnknKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJlYWN0aWZ5QWxpYXNlcy5hZGQoc3BlYy5sb2NhbC5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBMb29rIGZvciByZWFjdGlmeSBjYWxscy4gS2VlcCB0cmFjayBvZiB0aGUgbmFtZXMgb2YgZWFjaCBjb21wb25lbnQgc28gd2UgY2FuIG1hcCBKU1ggdGFncyB0byB4dHlwZXMgYW5kXG4gICAgICAgICAgLy8gY29udmVydCBwcm9wcyB0byBjb25maWdzIHNvIFNlbmNoYSBDbWQgY2FuIGRpc2NvdmVyIGF1dG9tYXRpYyBkZXBlbmRlbmNpZXMgaW4gdGhlIG1hbmlmZXN0LlxuICAgICAgICAgIGlmIChub2RlLnR5cGUgPT0gJ1ZhcmlhYmxlRGVjbGFyYXRvcicgXG4gICAgICAgICAgJiYgbm9kZS5pbml0IFxuICAgICAgICAgICYmIG5vZGUuaW5pdC50eXBlID09PSAnQ2FsbEV4cHJlc3Npb24nIFxuICAgICAgICAgICYmIG5vZGUuaW5pdC5jYWxsZWUgXG4gICAgICAgICAgJiYgcmVhY3RpZnlBbGlhc2VzLmhhcyhub2RlLmluaXQuY2FsbGVlLm5hbWUpKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKG5vZGUudHlwZSlcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ1ZhcmlhYmxlRGVjbGFyYXRvcicpXG4gICAgICAgICAgICBpZiAobm9kZS5pZC5lbGVtZW50cykge1xuICAgICAgICAgICAgICAgICAgLy8gZXhhbXBsZTogY29uc3QgWyBQYW5lbCwgR3JpZCBdID0gcmVhY3RpZnkoJ1BhbmVsJywgJ0dyaWQnKTtcbiAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZS5pZC5lbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhZ05hbWUgPSBub2RlLmlkLmVsZW1lbnRzW2ldLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKCF0YWdOYW1lKSBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlTm9kZSA9IG5vZGUuaW5pdC5hcmd1bWVudHNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKCF2YWx1ZU5vZGUpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgYWRkVHlwZSh0YWdOYW1lLCB2YWx1ZU5vZGUpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgLy8gZXhhbXBsZTogY29uc3QgR3JpZCA9IHJlYWN0aWZ5KCdncmlkJyk7XG4gICAgICAgICAgICAgICAgICBjb25zdCB2YXJOYW1lID0gbm9kZS5pZC5uYW1lO1xuICAgICAgICAgICAgICAgICAgY29uc3QgYXJnID0gbm9kZS5pbml0LmFyZ3VtZW50cyAmJiBub2RlLmluaXQuYXJndW1lbnRzWzBdICYmIG5vZGUuaW5pdC5hcmd1bWVudHNbMF07XG4gICAgICAgICAgICAgICAgICBpZiAodmFyTmFtZSAmJiBhcmcpIGFkZFR5cGUodmFyTmFtZSwgYXJnKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIENvbnZlcnQgUmVhY3QuY3JlYXRlRWxlbWVudCguLi4pIGNhbGxzIHRvIHRoZSBlcXVpdmFsZW50IEV4dC5jcmVhdGUoLi4uKSBjYWxscyB0byBwdXQgaW4gdGhlIG1hbmlmZXN0LlxuICAgICAgICAgIGlmIChub2RlLnR5cGUgPT09ICdDYWxsRXhwcmVzc2lvbicgXG4gICAgICAgICAgJiYgbm9kZS5jYWxsZWUub2JqZWN0IFxuICAgICAgICAgICYmIG5vZGUuY2FsbGVlLm9iamVjdC5uYW1lID09PSAnUmVhY3QnIFxuICAgICAgICAgICYmIG5vZGUuY2FsbGVlLnByb3BlcnR5Lm5hbWUgPT09ICdjcmVhdGVFbGVtZW50Jykge1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhub2RlLnR5cGUpXG4gICAgICAgICAgICBjb25zdCBbdGFnLCBwcm9wc10gPSBub2RlLmFyZ3VtZW50cztcbiAgICAgICAgICAgIGxldCB0eXBlID0gdHlwZXNbdGFnLm5hbWVdO1xuICAgICAgICAgICAgaWYgKHR5cGUpIHtcbiAgICAgICAgICAgICAgbGV0IGNvbmZpZztcbiAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocHJvcHMucHJvcGVydGllcykpIHtcbiAgICAgICAgICAgICAgICAgIGNvbmZpZyA9IGdlbmVyYXRlKHByb3BzKS5jb2RlO1xuICAgICAgICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjb25maWcgPSBge1xcbiAgJHtrZXl9OiAnJHt0eXBlW2tleV19Jywke2NvbmZpZy5zbGljZSgxKX1gO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgY29uZmlnID0gSlNPTi5zdHJpbmdpZnkodHlwZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc3RhdGVtZW50cy5wdXNoKGBFeHQuY3JlYXRlKCR7Y29uZmlnfSlgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIGVuc3VyZSB0aGF0IGFsbCBpbXBvcnRlZCBjbGFzc2VzIGFyZSBwcmVzZW50IGluIHRoZSBidWlsZCBldmVuIGlmIHRoZXkgYXJlbid0IHVzZWQsXG4gICAgLy8gb3RoZXJ3aXNlIHRoZSBjYWxsIHRvIHJlYWN0aWZ5IHdpbGwgZmFpbFxuICAgIGZvciAobGV0IGtleSBpbiB0eXBlcykge1xuICAgICAgc3RhdGVtZW50cy5wdXNoKGBFeHQuY3JlYXRlKCR7SlNPTi5zdHJpbmdpZnkodHlwZXNba2V5XSl9KWApXG4gICAgfVxuXG4vL2NvbnNvbGUubG9nKCdcXG5cXG5zdGF0ZW1lbnRzOicpXG4vL2NvbnNvbGUubG9nKHN0YXRlbWVudHMpXG4vL2NvbnNvbGUubG9nKCdcXG5cXG4nKVxuXG4gICAgcmV0dXJuIHN0YXRlbWVudHM7XG59O1xuIl19