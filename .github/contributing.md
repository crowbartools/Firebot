# Welcome!
Welcome to the Firebot community! We regularly receive and welcome community contributions. However, they are subject to the following standards and guidelines.

# Code of Conduct
First and foremost, all contributors and contributions are subject to our [community code of conduct](CODE_OF_CONDUCT.md). Any violations of the code of conduct are subject to the enforcement actions listed therein.

# Before You Begin
Before starting development on a new feature or fix, please ensure the following prerequisites are met:
- **Open Issue**: Any community work must be associated with an open issue and any proposed changes must be as detailed as possible. This is crucial for us to understand what and how work is being done, along with any potential impacts to existing features.
- **Approved by Firebot Team**: Any work done **must** be approved by the Firebot team before it can begin. This is especially true for larger projects (e.g. refactors or rewrites of critical core components). This process ensures effort is not wasted and that it doesn't overlap or conflict with other Firebot initiatives.

> [!WARNING]
> Any pull request submitted without a relevant issue or approval from the Firebot team will be closed.

# Working on Code

## Branches
The `master` branch is reserved for the current latest release.

> [!WARNING]
> **Do not target pull requests to the `master` branch.** Pull requests targeting the `master` branch will be closed.

All active developement work is done against the `v5` branch. When performing work, create a feature branch from the most recent `v5` commit, then target the `v5` branch when you create a pull request.

## Testing
Before opening a pull request, best effort testing must be done to ensure changes work and do not break existing functionality. For new features, this includes full testing of the new feature code. For bug fixes, this includes testing that the fix fully resolves the relevant issue. In both cases, regression testing should be done to ensure that existing functionality continues to work as expected.
  
> [!WARNING]
> Pull requests not properly tested may be closed.

## Formatting
ESLint will handle most formatting concerns, so ensure that your editor is following both the ESLint and `.editorconfig` rules.

We use Unix-style end of line character (line feed `\n` or `\x0A`, not the Windows-style carriage return + line feed `\r\n`)

We use 4 spaces for indents.

# Opening Pull Requests

## Branch

As mentioned above, all pull requests must target the `v5` branch.

## Title

Pull request titles should adhere to the following format:

> `type(scope): short description (#issue)`

- The `type` should be a lowercase value that follows the [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) format. Firebot specifically focuses on the following types:
  - `feat`: New/updated feature
  - `fix`: Bug fix
  - `chore`: Housekeeping items such as refactors, cleanup, or comments that do not change functionality.
- (Optional) The `scope` should include a single word to indicate what feature or area of the code this affects (e.g. `effects` or `chat`). 
- The `short description` should be no more than a few words to describe the change.
- The `issue` field should be the primary issue number this change addresses, including the `#` sign and enclosed in parentheses (e.g. `(#1608)`).

The following are examples of well-formatted titles:
- `fix: change Save All effects dropdown to a dropup (#1804)`
- `feat(vars): add $isUserInChat (#2477)`
- `feat: multiline textarea in preset list args (#2399)`

## Description

When opening a pull request, ensure that the following information is included in the description:

- **Description of the Change**: Detail the change as much as possible, including any new, changed, and removed functionality. Also include any notes on how the change affects other areas of Firebot, if applicable.
- **Applicable Issues**: List any issues (i.e. feature requests or bug reports) related to this change.
- **Testing**: Detail all testing done for this pull request, including relevant testing steps, inputs, and outputs.
- **Screenshots**: For any work that makes changes to or can be verified in the UI, include screenshots of the updated functionality.
  
> [!WARNING]
> Pull requests missing any of the listed information above may be closed.

# Review Process

## Community Review

We believe in a collaborative environment and welcome collaboration between our community members! However, community contributors should leave feedback or ask questions either in the PR comments or in the **dev** channel in Discord. Please keep feedback constructive and courteous, always adhering to our code of conduct.

The GitHub review features (approvals, commenting on/requesting changes to code) are reserved for Firebot team members **only**. Please do not use these features, as only Firebot team members may request changes or approve/reject pull requests.

In conjunction with the above, please do not leave "LGTM" or similar comments on PRs. That kind of feedback and determination, while it may be well-intentioned, can only be made by members of the Firebot team.

## Requested Changes

As part the review process, we may require changes if we believe they are needed to meet the vision & standards of Firebot, and that's OK! Some reasons for this include maintaining compatibility with previous versions, ensuring consistent user experience, etc. We may also suggest tweaks to simplify the code, make it more efficient, or make it easier to maintain long term.

*Please don't take this feedback personally.* We simply want Firebot to be the best that it can be for all of our users.