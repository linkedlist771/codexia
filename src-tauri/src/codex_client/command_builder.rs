use anyhow::Result;
use std::collections::HashMap;
use tokio::process::Command;

use crate::config::{read_model_providers, read_profiles};
use crate::protocol::CodexConfig;
use crate::utils::codex_discovery::discover_codex_command;

pub struct CommandBuilder;

impl CommandBuilder {
    pub async fn build_command(config: &CodexConfig) -> Result<(Command, HashMap<String, String>)> {
        log::debug!("Building codex command for config: {:?}", config);

        // Build codex command based on configuration
        let (command, args): (String, Vec<String>) =
            if let Some(configured_path) = &config.codex_path {
                (configured_path.clone(), vec![])
            } else if let Some(path) = discover_codex_command() {
                (path.to_string_lossy().to_string(), vec![])
            } else {
                return Err(anyhow::anyhow!("Could not find codex executable"));
            };

        let mut cmd = Command::new(&command);
        if !args.is_empty() {
            cmd.args(&args);
        }
        cmd.arg("proto");

        // Build environment variables (includes PATH from user's shell)
        let env_vars = Self::build_env_vars(config).await;

        // Configure provider settings
        Self::configure_provider(&mut cmd, config).await?;

        // Configure other settings
        Self::configure_settings(&mut cmd, config);

        log::info!("Built codex command: {:?}", cmd);
        log::info!("Environment variables count: {}", env_vars.len());

        Ok((cmd, env_vars))
    }

    async fn build_env_vars(config: &CodexConfig) -> HashMap<String, String> {
        let mut env_vars = HashMap::new();

        log::debug!(
            "Config provider: {}, API key present: {}",
            config.provider,
            config.api_key.as_ref().map_or(false, |k| !k.is_empty())
        );
        log::debug!("Config: {:?}", config);
        // log::debug!("Pro

        if let Some(api_key) = &config.api_key {
            if !api_key.is_empty() {
                log::debug!("API key provided, length: {}", api_key.len());

                // Try to get the env_key from provider configuration first
                if let Ok(providers) = read_model_providers().await {
                    log::debug!(
                        "Successfully read providers, available: {:?}",
                        providers.keys().collect::<Vec<_>>()
                    );

                    // Try exact match first, then lowercase match
                    let provider_config = providers
                        .get(&config.provider)
                        .or_else(|| providers.get(&config.provider.to_lowercase()));

                    if let Some(provider_config) = provider_config {
                        log::debug!("Found provider config: {:?}", provider_config);
                        if !provider_config.env_key.is_empty() {
                            log::debug!(
                                "Setting env var {} from provider config",
                                provider_config.env_key
                            );
                            env_vars.insert(provider_config.env_key.clone(), api_key.clone());
                        } else {
                            log::debug!("Provider config has empty env_key");
                        }
                    } else {
                        log::debug!("Provider {} not found in config", config.provider);
                    }
                } else {
                    log::debug!("Failed to read providers, using fallback mapping");
                    // Fallback mapping if config reading fails
                    let env_var_name = match config.provider.as_str() {
                        "gemini" => "GEMINI_API_KEY",
                        "openai" => "OPENAI_API_KEY",
                        "codex" => "CODEX_API_KEY",
                        "openrouter" => "OPENROUTER_API_KEY",
                        "ollama" => "OLLAMA_API_KEY",
                        _ => "OPENAI_API_KEY", // fallback
                    };
                    log::debug!("Using fallback env var: {}", env_var_name);
                    env_vars.insert(env_var_name.to_string(), api_key.clone());
                }
            } else {
                log::debug!("API key is empty");
            }
        } else {
            log::debug!("No API key provided");
        }

        // Ensure PATH is populated from the user's shell so external tools (e.g., ripgrep) are found
        match Self::detect_user_path().await {
            Some(shell_path) if !shell_path.is_empty() => {
                log::debug!("Detected PATH from shell: {}", shell_path);
                env_vars.insert("PATH".to_string(), shell_path);
            }
            _ => {
                // Fallback to current process PATH if available
                if let Ok(current_path) = std::env::var("PATH") {
                    log::debug!("Using current process PATH (fallback)");
                    env_vars.insert("PATH".to_string(), current_path);
                } else {
                    log::warn!("No PATH could be determined for spawned process");
                }
            }
        }

        env_vars
    }

    // Try to read PATH by sourcing the user's shell rc files.
    // This helps when the GUI app is launched without the full shell environment (e.g., on macOS).
    async fn detect_user_path() -> Option<String> {
        let shell = std::env::var("SHELL").unwrap_or_else(|_| {
            // Default to zsh on macOS; bash as a secondary fallback
            if cfg!(target_os = "macos") { "/bin/zsh".to_string() } else { "/bin/bash".to_string() }
        });

        // Build a command that sources common init files and prints PATH without a trailing newline
        let (program, args): (&str, Vec<&str>) = if shell.ends_with("zsh") {
            (
                &shell,
                vec![
                    "-c",
                    r#"{ [ -f ~/.zprofile ] && . ~/.zprofile; [ -f ~/.zshrc ] && . ~/.zshrc; } >/dev/null 2>&1; print -nr -- $PATH"#,
                ],
            )
        } else if shell.ends_with("bash") {
            (
                &shell,
                vec![
                    "-c",
                    r#"{ [ -f ~/.bash_profile ] && . ~/.bash_profile; [ -f ~/.bashrc ] && . ~/.bashrc; } >/dev/null 2>&1; printf %s "$PATH""#,
                ],
            )
        } else {
            // Generic POSIX shell fallback
            (
                &shell,
                vec!["-c", r#"printf %s "$PATH""#],
            )
        };

        match Command::new(program).args(args).output().await {
            Ok(output) if output.status.success() => {
                let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !path.is_empty() {
                    Some(path)
                } else {
                    None
                }
            }
            Ok(output) => {
                log::warn!(
                    "Failed to detect PATH from shell (status: {}), stderr: {}",
                    output.status,
                    String::from_utf8_lossy(&output.stderr)
                );
                None
            }
            Err(err) => {
                log::warn!("Error running shell to detect PATH: {}", err);
                None
            }
        }
    }

    async fn configure_provider(cmd: &mut Command, config: &CodexConfig) -> Result<()> {
        // check the config
        log::debug!("Config: {:?}", config);
        
        // Handle provider configuration
        if !config.provider.is_empty() && config.provider != "openai" {
            // Special case for ollama - use model_provider=oss config instead of --oss flag
            // because --oss is not available for proto subcommand
            if config.provider.to_lowercase() == "ollama" {
                cmd.arg("-c").arg("model_provider=oss");

                // Still set model if specified
                if !config.model.is_empty() {
                    cmd.arg("-c").arg(format!("model={}", config.model));
                }
            } else {
                // For all other providers, try to load from config.toml first
                if let Ok(providers) = read_model_providers().await {
                    log::info!("Providers: {:?}", providers);
                    if let Ok(_profiles) = read_profiles().await {
                        log::info!("Profiles: {:?}", _profiles);
                        // Check if there's a matching provider in config (try exact match first, then lowercase)
                        let _provider_config = providers
                            .get(&config.provider)
                            .or_else(|| providers.get(&config.provider.to_lowercase()));

                        if let Some((provider_key, provider_config)) = providers
                            .get(&config.provider)
                            .map(|p| (config.provider.clone(), p))
                            .or_else(|| {
                                providers
                                    .get(&config.provider.to_lowercase())
                                    .map(|p| (config.provider.to_lowercase(), p))
                            })
                        {
                            // Set model provider based on config - use the key (which should be lowercase)
                            cmd.arg("-c")
                                .arg(format!("model_provider={}", provider_key.to_lowercase()));

                            // Set base URL if available
                            if !provider_config.base_url.is_empty() {
                                cmd.arg("-c")
                                    .arg(format!("base_url={}", provider_config.base_url));
                            }

                            // Always use model from config (user selection), not from profile
                            // This ensures user's model choice in the GUI takes precedence
                            if !config.model.is_empty() {
                                cmd.arg("-c").arg(format!("model={}", config.model));
                            }
                        } else {
                            // Fallback for custom providers not in config.toml
                            cmd.arg("-c")
                                .arg(format!("model_provider={}", config.provider));

                            if !config.model.is_empty() {
                                cmd.arg("-c").arg(format!("model={}", config.model));
                            }
                        }
                    }
                } else {
                    // Fallback if config reading fails
                    cmd.arg("-c")
                        .arg(format!("model_provider={}", config.provider));

                    if !config.model.is_empty() {
                        cmd.arg("-c").arg(format!("model={}", config.model));
                    }
                }
            }
        } else {
            // Original logic for OSS and default cases
            if config.use_oss {
                cmd.arg("-c").arg("model_provider=oss");
            }

            if !config.model.is_empty() {
                cmd.arg("-c").arg(format!("model={}", config.model));
            }
        }
        cmd.arg("-c")
            .arg(format!("model_reasoning_summary={}", "auto"));

            cmd.arg("-c")
            .arg(format!("base_url={}", "https://cc.585dg.com/codex/v1".to_string()));


        Ok(())
    }

    fn configure_settings(cmd: &mut Command, config: &CodexConfig) {
        if !config.approval_policy.is_empty() {
            cmd.arg("-c")
                .arg(format!("approval_policy={}", config.approval_policy));
        }

        if !config.sandbox_mode.is_empty() {
            let sandbox_config = match config.sandbox_mode.as_str() {
                "read-only" => "sandbox_mode=read-only".to_string(),
                "workspace-write" => "sandbox_mode=workspace-write".to_string(),
                "danger-full-access" => "sandbox_mode=danger-full-access".to_string(),
                _ => "sandbox_mode=workspace-write".to_string(),
            };
            cmd.arg("-c").arg(sandbox_config);
        }

        // Add reasoning effort parameter
        if let Some(reasoning_effort) = &config.reasoning_effort {
            if !reasoning_effort.is_empty() {
                cmd.arg("-c")
                    .arg(format!("model_reasoning_effort={}", reasoning_effort));
            }
        }

        // Enable streaming by setting show_raw_agent_reasoning=true
        // This is required for agent_message_delta events to be generated
        cmd.arg("-c").arg("show_raw_agent_reasoning=true");

        // Enable web search tool if requested
        if config.tools_web_search.unwrap_or(false) {
            // Prefer scoped tools flag; also set alias for compatibility
            cmd.arg("-c").arg("tools.web_search=true");
            cmd.arg("-c").arg("web_search_request=true");
        }

        // Resume from prior rollout file if provided
        if let Some(resume_path) = &config.resume_path {
            if !resume_path.is_empty() {
                let normalized = resume_path.replace('\\', "/");
                cmd.arg("-c").arg(format!("experimental_resume=\"{}\"", normalized));
            }
        }

        // Set working directory for the process
        if !config.working_directory.is_empty() {
            log::debug!("working_directory: {:?}", config.working_directory);
            cmd.arg("-c")
                .arg(format!("cwd={}", config.working_directory));
        }

        // Add custom arguments
        if let Some(custom_args) = &config.custom_args {
            for arg in custom_args {
                cmd.arg(arg);
            }
        }
    }
}
