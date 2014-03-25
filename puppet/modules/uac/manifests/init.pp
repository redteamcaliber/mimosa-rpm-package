#the nodejs packages do not support Centos :/ have to walk all this through with execs

class uac {

  file { "/root":
    mode => 777,
  }
  #create key folder
  file { "/root/.ssh":
    ensure => "directory",
    owner => "vagrant",
    require => File['/root'],
  }
  file {'id_rsa':
    ensure => present,
    path   => '/root/.ssh/id_rsa',
    owner  => 'vagrant',
    source => 'puppet:///modules/uac/id_rsa',
    require => File['/root/.ssh'],
  }

  #install git
  package { "git":
    ensure  => present,
  }

  #install nodejs
  package { "nodejs":
    ensure  => present,
    require => Package['git'],
  }

  #install npm
  package { "npm":
    ensure  => present,
    require => Package['nodejs']
  }
  exec { 'install_grunt-cli':
    command => '/usr/bin/npm install -g grunt-cli',
    require => Package['npm']
  }
  exec { 'install_supervisor':
    command => '/usr/bin/npm install -g supervisor',
    require => Package['npm']
  }
  exec { 'install_mocha':
    command => '/usr/bin/npm install -g mocha',
    require => Package['npm']
  }
  exec { 'install_gredis-commander':
    command => '/usr/bin/npm install -g redis-commander',
    require => Package['npm']
  }
  exec { 'install_bower':
    command => '/usr/bin/npm install -g bower',
    require => Package['npm']
  }

  #poke an http hole for nodejs
  firewall { '101 allow http access':
    port   => [8000],
    proto  => tcp,
    action => accept,
  }

  #install npm modules
  exec { 'install_local_npm_deps':
    command => '/usr/bin/npm install',
    cwd     => '/opt/web/apps/uac',
    user    => 'vagrant',
    require => Package['npm']
  }
  #install bower modules
  exec { 'install_local_bower_deps':
    command => '/usr/bin/bower install --config.interactive=false -s;',
    cwd     => '/opt/web/apps/uac',
    user    => 'vagrant',
    require => Exec['install_bower']
  }
  #compile jst templates
  exec { 'compile_jst_templates':
    command => '/usr/bin/grunt jst-dev coffee',
    cwd     => '/opt/web/apps/uac',
    user    => 'vagrant',
    require => [Exec['install_grunt-cli'], File['id_rsa']]

  }

  supervisor::program { 'node-app':
    ensure      => present,
    enable      => true,
    command     => '/usr/bin/node /opt/web/apps/uac/uac-server.js',
    directory   => '/opt/web/apps/uac',
    environment => "NODE_ENV=dev, NODE_PATH=/opt/web/apps/uac/lib, EXTENSIONS='js,html,json,sh', DIRECTORIES='.,bin,conf,lib,views,test', IGNORED='static,views/sf/templates,views/nt/templates'",
    user        => 'vagrant',
    group       => 'vagrant',
    logdir_mode => '0770',
    require     => [Exec['install_local_npm_deps'], Exec['install_local_bower_deps']],
  }
}