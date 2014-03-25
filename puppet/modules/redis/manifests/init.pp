class redis {
  package { ['redis']:
    ensure => present;
  }

  #start the service
  service { 'redis':
    ensure  => running,
    require => Package['redis']
  }
}