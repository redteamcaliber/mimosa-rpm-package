class baseconfig {

  # Setup a EPEL repo, the default one is disabled.
  file { "EpelRepo" :
      path   => "/etc/yum.repos.d/epel.repo",
      source => 'puppet:///modules/baseconfig/epel.repo',
      owner  => "root",
      group  => "root",
      mode  => 0644,
  }
  file { "EpelGPGKey" :
      path   => "/etc/pki/rpm-gpg/RPM-GPG-KEY-EPEL-6",
      source => 'puppet:///modules/baseconfig/RPM-GPG-KEY-EPEL-6',
      owner  => "root",
      group  => "root",
      mode  => 0644,
  }
  host { 'proxy.mcirt.mandiant.com':
    ip => '10.30.8.220',
    host_aliases => [ 'mcube.mcirt.mandiant.com' ],
  }
  host { 'puppet.mplex.us2.mcirt.mandiant.com':
    ip => '10.30.8.100',
  }
  host { 'candyvan.dev.mandiant.com':
    ip => '10.22.0.55',
  }
  host { 'uac.vm.mandiant.com':
    ip => '127.0.0.1',
  }

}