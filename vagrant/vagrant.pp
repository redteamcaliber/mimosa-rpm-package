node 'uac.vm.mandiant.com' {
  class { 'uac':
    uacEnv_uac_mcube_api_url    => "https://mcube.mcirt.mandiant.com",
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
    uacEnv_sso_auth_url         => "https://loginstage.mandiant.com/api/auth",
    uacEnv_sso_login_url        => "https://loginstage.mandiant.com",
    uacEnv_sso_refresh_url      => "https://loginstage.mandiant.com/refresh",
    uacEnv_sso_logout_url       => "https://loginstage.mandiant.com/logout",
    uacEnv_sso_unauth_url       => "https://loginstage.mandiant.com/unauth"
  }
}