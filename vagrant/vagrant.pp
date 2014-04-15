node 'uac.vm.mandiant.com' {
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
  }
}