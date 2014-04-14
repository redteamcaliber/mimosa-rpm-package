node 'uac.vm.mandiant.com' {
  class { 'uac':
    installProxy         => true,
    installKeystore      => true,
    installDatabase      => true,
    useDevSshConfig      => true,
    installHostsEntries  => true,
    installNodejsGlobals => true,
    configureSupervisord => false,
    proxyStaticFolder    => "/opt/web/apps/uac/dist/client",
  }
}