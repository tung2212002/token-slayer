"""`tui` subcommand and the shared TUI launch entrypoint.

`main`'s group callback calls `launch(paths)` directly when invoked with no
subcommand; the `tui` command below calls the same function explicitly.

TODO(Task 14): replace `launch` with the real Textual `SlayerApp` — this is
a v1-minimal stub so both call sites have something to invoke."""
from __future__ import annotations

import click

from slayer_cli.platform.paths import Paths

__all__ = ["command", "launch"]


def launch(paths: Paths) -> None:
    """Launch the interactive TUI.

    :param paths: Resolved OS paths for this namespace.
    :return: None
    :raises click.ClickException: Always, until Task 14 wires the real
        Textual `SlayerApp` in place of this stub.
    """
    raise click.ClickException("TUI not yet available")


@click.command(name="tui")
@click.pass_obj
def command(services) -> None:
    """Launch the interactive TUI explicitly."""
    launch(services.paths)
