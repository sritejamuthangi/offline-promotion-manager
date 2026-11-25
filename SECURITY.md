# Security policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

- Use GitHub's private vulnerability reporting ("Report a vulnerability" on the repository's
  Security tab), or
- send a private message to the maintainer on [LinkedIn](https://www.linkedin.com/in/sritejamuthangi/).

Include the steps to reproduce and, if possible, a sample file. You will get a reply as soon as
possible, and credit in the release notes if you would like it.

## Supported versions

Security fixes are made on the latest version of the `main` branch.

## Scope

The app has no server and stores data only in the browser. The most important risks are files
that people open or share, such as designs and templates. These are validated against the design
schema before use, and user content is never inserted into the page as raw HTML. Reports about
anything that lets a crafted file run code, read other data, or break out of its design are
especially welcome.
