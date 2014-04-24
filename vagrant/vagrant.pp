node 'uac.vm.mandiant.com' {
  include repos

  #simulated production env
#  class { 'uac':
#    installProxy                => true,
#    installKeystore             => true,
#    installDatabase             => true,
#    useDevSshConfig             => true,
#    installVagrantHostsEntries  => true,
#    installDevnetHostsEntries   => false,
#    installNodejsGlobals        => false,
#    configureSupervisord        => true,
#    setupDevelopmentEnvironment => false,
#    uacEnv_uac_db_host          => "localhost",
#    uacEnv_uac_sf_api_url       => "https://proxy.mcirt.mandiant.com/SF/",
#    uacEnv_uac_ss_api_url       => "https://proxy.mcirt.mandiant.com/SEASICK/",
#    uacEnv_uac_cv_api_url       => "http://candyvan.dev.mandiant.com:9001",
#    uacEnv_uac_mcube_api_url    => "https://mcube.mcirt.mandiant.com",
#    uacEnv_sso_auth_cookie      => "m_login_staging",
#    uacEnv_sso_auth_url         => "https://loginstage.mandiant.com/api/auth",
#    uacEnv_sso_login_url        => "https://loginstage.mandiant.com",
#    uacEnv_sso_refresh_url      => "https://loginstage.mandiant.com/refresh",
#    uacEnv_sso_logout_url       => "https://loginstage.mandiant.com/logout",
#    uacEnv_sso_unauth_url       => "https://loginstage.mandiant.com/unauth",
#    uacEnv_sso_pubkey           => "./conf/certs/sso-staging-pubkey-2012-02-10.pem",
#    uacEnv_server_log_level     => "debug"
#  }
  #development env
  class { 'uac':
    installProxy                => true,
    installKeystore             => true,
    installDatabase             => true,
    useDevSshConfig             => true,
    installVagrantHostsEntries  => true,
    installDevnetHostsEntries   => false,
    installNodejsGlobals        => true,
    configureSupervisord        => false,
    setupDevelopmentEnvironment => true,
    proxyStaticFolder           => "/opt/web/apps/uac/dist/client",
    uacEnv_uac_db_host          => "localhost",
    uacEnv_uac_sf_api_url       => "https://proxy.mcirt.mandiant.com/SF/",
    uacEnv_uac_ss_api_url       => "https://proxy.mcirt.mandiant.com/SEASICK/",
    uacEnv_uac_cv_api_url       => "http://candyvan.dev.mandiant.com:9001",
    uacEnv_uac_mcube_api_url    => "https://mcube.mcirt.mandiant.com",
    uacEnv_sso_auth_cookie      => "m_login_staging",
    uacEnv_sso_auth_url         => "https://loginstage.mandiant.com/api/auth",
    uacEnv_sso_login_url        => "https://loginstage.mandiant.com",
    uacEnv_sso_refresh_url      => "https://loginstage.mandiant.com/refresh",
    uacEnv_sso_logout_url       => "https://loginstage.mandiant.com/logout",
    uacEnv_sso_unauth_url       => "https://loginstage.mandiant.com/unauth",
    uacEnv_sso_pubkey           => "./conf/certs/sso-staging-pubkey-2012-02-10.pem",
    uacEnv_server_log_level     => "debug"
  }
}
