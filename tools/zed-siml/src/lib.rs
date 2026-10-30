use zed_extension_api::{self as zed, LanguageServerId, Result};

struct SimlExtension;

impl zed::Extension for SimlExtension {
    fn new() -> Self {
        SimlExtension
    }

    // The launcher regenerates stale protos, builds wowsimcli from the worktree and runs `wowsimcli siml lsp`.
    fn language_server_command(
        &mut self,
        _language_server_id: &LanguageServerId,
        worktree: &zed::Worktree,
    ) -> Result<zed::Command> {
        let go = worktree
            .which("go")
            .ok_or_else(|| "wowsims-siml: `go` is not on the PATH".to_string())?;
        Ok(zed::Command {
            command: go,
            args: vec![
                "-C".to_string(),
                worktree.root_path(),
                "run".to_string(),
                "./sim/siml/lsp/launch".to_string(),
            ],
            env: worktree.shell_env(),
        })
    }
}

zed::register_extension!(SimlExtension);
