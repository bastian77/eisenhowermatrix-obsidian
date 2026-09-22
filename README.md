# Priority Matrix Obsidian Plugin

Create a source-backed Eisenhower view from tasks in your vault.
A plugin made for [Obsidian](https://obsidian.md/)

<img src="Images/PriorityMatrix.png" width="600" />

## Features

- **Matrix View**: Visualize tasks in a 2x2 priority matrix based on priority and due date
- **Individual task scanning**: Scans each Markdown task independently, including multiple tasks in one note
- **Interactive priority management**: Drag tasks between important and not-important quadrants
- **Source-backed tasks**: Tasks remain in their original notes; the view does not duplicate task data
- **Tasks fields**: Uses `[priority:: ...]` and `[due:: YYYY-MM-DD]` fields from the Tasks/Dataview format
- **Flexible Configuration**: Customize the folder, recursion, and scan limit

## Installation
### From Obsidian Community Plugins

1. Open **Settings** → **Community plugins**
2. Make sure Safe mode is **off**
3. Click **Browse** and search for "Priority Matrix"
4. Click **Install**, then **Enable**

### Manual Installation

1. Download the latest release from the [GitHub repository](https://github.com/murtazaraza/prioritymatrix-obsidian)
2. Extract the zip file and copy the `main.js`, `manifest.json`, and `styles.css` files to your vault's `.obsidian/plugins/priority-matrix/` folder
3. Reload Obsidian
4. Enable the plugin in **Settings** → **Community plugins**

## Usage

### Opening the Eisenhower view
1. Open the command palette (`Ctrl+P` / `Cmd+P`)
2. Run **Open tasks Eisenhower view**
3. The view scans the configured folder and displays each open task once

### Working with the Matrix

- **Customise Settings**: Customize the folder, recursion, and scan limit
- **View Tasks**: Open Markdown tasks automatically appear in the matrix on refresh. Each source task is shown individually
- **Move Tasks**: Drag tasks between quadrants to reprioritize them
- **Edit Tasks**: Click on tasks to edit them directly in their source files
- **Open Source**: Click a task to open its original note

<img src="Images/Md.png" width="600" />

### Matrix Quadrants

The Eisenhower Matrix organizes tasks into four quadrants:

- **Q1 (Urgent & Important)**: Do these tasks immediately
- **Q2 (Not Urgent & Important)**: Schedule time for these tasks
- **Q3 (Urgent & Not Important)**: Delegate these if possible
- **Q4 (Not Urgent & Not Important)**: Consider eliminating these tasks

## Configuration

Access plugin settings via **Settings** → **Priority Matrix**.

### Scan Settings

- **Task folder**: Vault-relative path to scan for open tasks (default: `/` for entire vault)
- **Recursive scan**: Enable to scan subfolders of the include folder
- **Task detection**: Open Markdown tasks using `- [ ]`, `* [ ]`, `+ [ ]`, or numbered equivalents are detected automatically
- **Important from priority**: Configure the priority threshold that maps tasks to Important; priorities below it map to Not important
- **Urgent within days**: Configure how many days ahead a due date counts as urgent (default: `7`); overdue tasks are always urgent
- **Max files to scan**: Limit the number of files to scan (set to `0` for unlimited)

### Behavior Settings

- **Priority updates**: Dragging a task to an important or not-important quadrant updates its existing `[priority:: ...]` field in the source note

## Requirements

- Obsidian v1.2.3 or higher
- No additional dependencies required

## Troubleshooting

### Tasks Not Appearing

- Ensure your tasks use an open Markdown checkbox such as `- [ ] Task name`
- Check that the **Task folder** setting includes the note containing the task
- Verify that **Recursive scan** is enabled for tasks in subfolders
- Check the **Max files to scan** setting isn't limiting the scan

### Tasks view not opening

- Open the command palette and run **Open tasks Eisenhower view**

### Plugin Not Loading

- Verify the plugin is enabled in **Settings** → **Community plugins**
- Check that `main.js`, `manifest.json`, and `styles.css` are in the correct folder: `.obsidian/plugins/priority-matrix/`
- Try reloading Obsidian (`Ctrl+R` / `Cmd+R`)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues, feature requests, or questions:
- Open an issue on the [GitHub repository](https://github.com/murtazaRaza/prioritymatrix-obsidian)
- Check existing issues and discussions for solutions
