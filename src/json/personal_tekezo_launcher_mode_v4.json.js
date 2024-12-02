// JavaScript should be written in ECMAScript 5.1.

const parameters = {
  simultaneous_threshold_milliseconds: 500,
  trigger_key: 'o',
}

function main() {
  console.log(
    JSON.stringify(
      {
        title: 'Personal rules (@tekezo) Launcher Mode v4',
        maintainers: ['tekezo'],
        rules: [
          {
            description: 'Launcher Mode v4 (rev 25)',
            available_since: '15.3.4',
            manipulators: [].concat(
              generateLauncherMode('1', { historyIndex: 1 }),
              generateLauncherMode('2', { historyIndex: 2 }),
              generateLauncherMode('3', { historyIndex: 3 }),
              generateLauncherMode('4', { historyIndex: 4 }),
              generateLauncherMode('5', { historyIndex: 5 }),
              generateLauncherMode('a', { bundleIdentifier: 'com.apple.ActivityMonitor' }),
              generateLauncherMode('c', { bundleIdentifier: 'com.google.Chrome' }),
              generateLauncherMode('e', { bundleIdentifier: 'com.microsoft.VSCode' }),
              generateLauncherMode('f', { bundleIdentifier: 'com.apple.finder' }),
              generateLauncherMode('g', { bundleIdentifier: 'com.openai.chat' }),
              generateLauncherMode('m', { bundleIdentifier: 'org.mozilla.thunderbird' }),
              generateLauncherMode('q', { bundleIdentifier: 'com.apple.Dictionary' }),
              generateLauncherMode('s', { bundleIdentifier: 'com.apple.Safari' }),
              generateLauncherMode('t', { bundleIdentifier: 'com.apple.Terminal' }),
              generateLauncherMode('v', { bundleIdentifier: 'com.tinyspeck.slackmacgap' }),

              generateLauncherMode('left_control', { to: [{ key_code: 'mission_control' }] }),
              generateLauncherMode('left_shift', { to: [{ apple_vendor_keyboard_key_code: 'launchpad' }] })
            ),
          },
        ],
      },
      null,
      '  '
    )
  )
}

function generateLauncherMode(
  from_key_code,
  /**
   * @type {{
   *   bundleIdentifier?: string,
   *   historyIndex?: number,
   *   to?: any[],
   * }} */
  options
) {
  const result = []

  var to = []
  if (options.bundleIdentifier !== undefined) {
    to.push({
      software_function: {
        open_application: {
          bundle_identifier: options.bundleIdentifier,
        },
      },
    })
  }
  if (options.historyIndex !== undefined) {
    to.push({
      software_function: {
        open_application: {
          history_index: options.historyIndex,
        },
      },
    })
  }
  if (options.to !== undefined) {
    to = to.concat(options.to)
  }

  const definitions = []

  if (options.bundleIdentifier !== undefined) {
    //
    // Do not call shell if the application is already focused.
    //
    // In the combination of macOS 14.1.1 and Google Chrome 119,
    // there is a problem that keyboard shortcuts of switching windows are ignored until
    // Google Chrome is unfocused if shell_command is called when the application is already frontmost.
    //
    // To avoid this problem, we skip shell_command when the application is focused.
    //
    definitions.push({
      extraConditions: [
        {
          type: 'frontmost_application_if',
          bundle_identifiers: ['^' + options.bundleIdentifier.replace(/\./g, '\\.') + '$'],
        },
      ],
      extraTo: [],
    })
  }

  // Call shell command if the application is not frontmost.
  definitions.push({
    extraConditions: [],
    extraTo: to,
  })

  definitions.forEach(function (def) {
    result.push({
      type: 'basic',
      from: {
        key_code: from_key_code,
        modifiers: { optional: ['any'] },
      },
      to: def.extraTo,
      conditions: [].concat(
        [
          {
            type: 'variable_if',
            name: 'launcher_mode_v4',
            value: 1,
          },
        ],
        def.extraConditions
      ),
    })

    result.push({
      type: 'basic',
      from: {
        simultaneous: [{ key_code: parameters.trigger_key }, { key_code: from_key_code }],
        simultaneous_options: {
          key_down_order: 'strict',
          key_up_order: 'strict_inverse',
          to_after_key_up: [
            {
              set_variable: {
                name: 'launcher_mode_v4',
                value: 0,
              },
            },
          ],
        },
        modifiers: { optional: ['any'] },
      },
      to: [
        {
          set_variable: {
            name: 'launcher_mode_v4',
            value: 1,
          },
        },
      ].concat(def.extraTo),
      conditions: def.extraConditions,
      parameters: {
        'basic.simultaneous_threshold_milliseconds': parameters.simultaneous_threshold_milliseconds,
      },
    })
  })

  return result
}

main()
