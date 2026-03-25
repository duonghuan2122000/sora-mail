## ADDED Requirements

### Requirement: User can select theme

The system SHALL provide a UI control (toggle/switch) allowing the user to select between "light" and "dark" themes.

#### Scenario: Theme toggle is visible

- **WHEN** the user navigates to the Settings page
- **THEN** the theme toggle control is visible and accessible

#### Scenario: User switches to dark mode

- **WHEN** the user toggles the theme switch to "dark"
- **THEN** the application UI immediately updates to dark mode styles
- **THEN** the theme preference is saved to persistent storage

#### Scenario: User switches to light mode

- **WHEN** the user toggles the theme switch to "light"
- **THEN** the application UI immediately updates to light mode styles
- **THEN** the theme preference is saved to persistent storage

### Requirement: Theme preference is persisted

The system SHALL store the user's theme preference and restore it on application startup.

#### Scenario: Load theme on startup (dark)

- **WHEN** the application starts
- **AND** the stored theme preference is "dark"
- **THEN** the application UI loads with dark mode styles applied

#### Scenario: Load theme on startup (light)

- **WHEN** the application starts
- **AND** the stored theme preference is "light"
- **THEN** the application UI loads with light mode styles applied

#### Scenario: Default theme when no preference exists

- **WHEN** the application starts
- **AND** no theme preference is stored
- **THEN** the application UI loads with light mode styles (default)
