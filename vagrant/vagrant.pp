node 'uac.vm.mandiant.com' {
  class { 'uac':
    installProxy         => true,
    installKeystore      => true,
    installDatabase      => true,
    targetEnvironment    => "development",
  }
}