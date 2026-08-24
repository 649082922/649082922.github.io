---
title: Oracle查找UNDO段信息脚本
published: 2025-02-01
description: "use Sys::Hostname;"
tags: ["Oracle", "实战笔记"]
category: 数据库
draft: false
---

mount 状态
perl xx.p
#!/usr/bin/perl

use strict;
use warnings;
use English;
use Sys::Hostname;
use Term::ANSIColor qw(:constants);
use Getopt::Long qw(:config no_ignore_case bundling);
use POSIX qw/strftime/;
use Data::Dumper;
use Env qw(PATH LD_LIBRARY_PATH DISPLAY);
use Fcntl qw(:mode);
use Encode qw(from_to);

our $versionNum = 1.1;
our $trcfd;
our $traceFile;
our $dbstatus = 'NO';
our $dbversion;

our %undosegblock = (
        "102010"  => 105,
        "102020"  => 105,
        "102030"  => 105,
        "102040"  => 105,
        "102050"  => 105,
        "112010"  => 224,
        "112020"  => 224,
        "112030"  => 224,
        "112040"  => 224,
		"190000"  => 224
);
our %dbfname;
our %filemap;
our @undosegname;
## <<---------------------[ Begin Function ]--------------------------->>

sub MsgPrint
{
    my ($type, $msg, $step) = @_;
    my $printMsg = $msg;
    if ($type eq "E" || $type eq "EE")
    {
        print BOLD, RED, "ERROR: ", RESET;
        if ($trcfd)
        {
            print $trcfd "ERROR: ";
        }
    }
    elsif ($type eq "I")
    {
        print BOLD, BLUE, "INFO: ", RESET;
        if ($trcfd)
        {
            print $trcfd "INFO: ";
        }
    }
    elsif ($type eq "W")
    {
        print BOLD, MAGENTA, "WARNING: ", RESET;
        if ($trcfd)
        {
            print $trcfd "WARNING: ";
        }
    }
    elsif ($type eq "S")
    {
        print BOLD, GREEN, "SUCCESS: ", RESET;
        if ($trcfd)
        {
            print $trcfd "SUCCESS: ";
        }
    }
    if (defined $step)
    {
        $printMsg = "$msg #Step $step#";
    }
    print "$printMsg\n";
    # Trace("$printMsg");
    if ($trcfd)
    {
        print $trcfd "$printMsg\n";
    }
}
sub Trace
{
    my ($output) = @_;
    my ($sec, $min, $hour, $day, $month, $year) =
      (localtime)[ 0, 1, 2, 3, 4, 5 ];
    $month = $month + 1;
    $year  = $year + 1900;
    $output =~ s/%/%%/g;
    printf $trcfd "%04d-%02d-%02d %02d:%02d:%02d: $output\n", $year, $month, $day, $hour, $min, $sec;
}
sub DieTrap
{
    my ($msg) = @_;
    # if ($trcfd)
    # {
    #     print $trcfd "$msg\n";
    # }
    MsgPrint("E","$msg");
    die("$msg\n");
}
sub InitLogfile
{
    my ($dt, $hname, $logPrefix);
    # $runstartTime = time();
    $dt = strftime("%Y%m%d%H%M%S", localtime);
    $hname = GetHostName();
    $logPrefix = $hname;
    $traceFile = "/tmp/analyzeundo-$logPrefix.trc";
    MsgPrint('I', "InitLogfile Logfile : $traceFile");
    open($trcfd, "> $traceFile");
}

sub DoCleanExit
{
    MsgPrint("I", "Log file is $traceFile ...");
    print "Exiting...\n";
    exit 0;
}
sub PrintVersionNum {
  print "\n\tanlyzeundo Version is $versionNum by Travel.liu. \n";
  print "Copyright (c) 2015-2016, Enmotech and/or its affiliates. All rights reserved.\n\n";
  exit 0;
}

sub ParseArgs
{
    our ($opt_v);
    GetOptions(
      'version|v!'    => \$opt_v
    );
    if (defined $opt_v)
    {
        PrintVersionNum();
    }
}

sub to_upper
{
    my $var = $_[0];
    $var =~ tr/a-z/A-Z/;
    return $var;
}
sub TrimSpace
{
    my $str = shift;
    $str =~ s/^[\s]+//;
    $str =~ s/\s+$//;
    $str =~ s/^\s*\n//;
    return $str;
}
sub GetHostName
{
    my $host = hostname() or return "";
    my $shorthost;
    if ($host =~ /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/)
    {
        $shorthost = $host;
    }
    else
    {
        ($shorthost,) = split(/\./, $host);
    }
    $shorthost =~ tr/A-Z/a-z/;
    return $shorthost;
}

sub run_system_cmd
{
    my $rc  = 0;
    my $prc = 0;
    my @output;
    # print "@_\n";
    Trace("Executing cmd: @_");
    if (!open(CMD, "@_ 2>&1 |")) { $rc = -1; }
    else
    {
        @output = (<CMD>);
        close CMD;
        $prc = $CHILD_ERROR >> 8;    # get program return code right away
        chomp(@output);
    }
    if (scalar(@output) > 0)
    {
        Trace(join("\n>  ", ("Command output:", @output)), "\n>End Command output");
    }
    if ($prc != 0)
    {
        $rc = $prc;
    }
    # elsif ($rc < 0 || ($rc = $CHILD_ERROR) < 0)
    # {
    #     MsgPrint("E", "Failure in execution (rc=$rc, $CHILD_ERROR, $!) for command @_");
    # }
    elsif ($rc & 127)
    {
        my $sig = $rc & 127;
        # MsgPrint("E", "Failure with signal $sig from command: @_");
    }
    elsif ($rc)
    {
        Trace("Failure with return code $rc from command @_");
    }
    return ($rc, @output);
}

sub executeSQL{
    my $sqlExec     = $_[0];
    my $sqltype     = $_[1];
    my $checkErrors = 1;

    if (defined $_[2])
    {
        $checkErrors = 0;
    }
    return executeSQLSQLPLUS( $sqlExec, $sqltype, $checkErrors);

}

sub executeSQLSQLPLUS
{
    # Build SQL Scripts
    my ($sqlExec,$sqltype,$checkErrors) = @_;

    my $scriptsFile = '.sql_script.tmp';

    my $connectRole = "/ as sysdba";

    $sqlExec = $sqlExec . ";";

    open SQLSCRIPTTEMP, ">", $scriptsFile;
    printf SQLSCRIPTTEMP "%s\n", "SET LINES 11111 PAGES 0 TRIM ON TRIMS ON TI OFF TIMI OFF AUTOT OFF FEED OFF SERVEROUTPUT ON SIZE UNLIMITED";
    if (defined $sqltype)
    {
        printf SQLSCRIPTTEMP "%s\n","SET FEED ON";
    }
    printf SQLSCRIPTTEMP "%s\n%s\n",$sqlExec, "EXIT";
    close SQLSCRIPTTEMP;

    Trace("SQL-connectRole cmd: $connectRole");
    Trace("SQL-sqlExec cmd: $sqlExec");

    my ($rc,@output ) = run_system_cmd("sqlplus -s -L '$connectRole' \@$scriptsFile;");

    Trace("SQL-sqlResult cmd: ''' @output ''' ");

    # Check Result File
    # @output =~ s/%/%%/g;

    if ($checkErrors == 1){
        foreach (@output){
            chomp;
            my $errorLine = $_;
            if ($errorLine =~ m/\AORA\-[0-9]{5}/){
                MsgPrint('E', "\033[31mSQL Error : [$errorLine]\033[0m");
            }
            elsif($errorLine =~ m/command\snot\sfound/){
                MsgPrint('E', "\033[31mCMD Error : SQL*Plus Not Found \033[0m");
            }
        }
    }
    # unlink $scriptsFile;
    # Result SQL Result
    return @output;

}

## <<----------------------[ End Function ]---------------------------->>

sub CheckVersion
{
    my @sqlResult = executeSQL("SELECT BANNER from v\$version where rownum = 1");
    # print "$sqlResult[0]\n";
    my @temp = split(/\s+/ ,$sqlResult[0]);
    $dbversion =  $temp[6];
    $dbversion =~ s/\.//g;
    MsgPrint('I', "Database Version is : $dbversion ");
    MsgPrint('I', "Undo\$ Segment Block on datafile 1 block $undosegblock{$dbversion}");
}

sub CheckDBStatus
{
    my @inst_status = executeSQL("SELECT STATUS FROM V\$INSTANCE");
    if ($inst_status[0] eq "MOUNTED") {
        $dbstatus = "OK";
    }
    elsif ($inst_status[0] eq "OPEN")
    {
        $dbstatus = "OK";
    }
}
sub CheckTS
{
    my $sql = "select rfile#,name from v\$datafile where ts#=0";
    my @sqlResult = executeSQL($sql);
    foreach (@sqlResult)
    {
        my @temp = split(/\s+/);
        $dbfname{$temp[1]} = $temp[2];
        MsgPrint("I","Datafile rfile : $temp[1] name : $temp[2]" );
    }
}

sub DumpUndoSegment
{
    my $sql = "alter system dump datafile'".$dbfname{'1'}."' block ".$undosegblock{$dbversion};
    my $sql1 = "SELECT d.VALUE || '/' || LOWER(RTRIM(i.INSTANCE, CHR(0))) || '_ora_' ||
           p.spid || '.trc' trace_file_name
      FROM (SELECT p.spid
              FROM v\$mystat m, v\$session s, v\$process p
             WHERE m.statistic# = 1
               AND s.SID = m.SID
               AND p.addr = s.paddr) p,
           (SELECT t.INSTANCE
              FROM v\$thread t, v\$parameter v
             WHERE v.NAME = 'thread'
               AND (v.VALUE = '0' OR to_char(t.thread#) = v.VALUE)) i,
           (select value from v\$diag_info WHERE name='Diag Trace') d";
    $sql = $sql . ";\n".$sql1;
    my @sqlResult = executeSQL($sql);
    my $findMap = 0;
    my $tracefile = $sqlResult[0];

    MsgPrint("I","Undo Segment Block Dump Trace $tracefile");
    Trace("Undo Segment Block Dump Trace : $tracefile");

    if (open(GRIDINSTLOG, "< $tracefile"))
    {
        while (<GRIDINSTLOG>)
        {
            chomp();
            next unless /\S/;
            if ($_ =~ /Extent Map/)
            {
                $findMap = 1;
            }
            if ($_ =~ /nfl = 1/)
            {
                $findMap = 0;
            }
            if ($findMap == 1) {
                if ($_ =~ /----/ || $_ =~ /Extent Map/) {
                    next
                } else {
                   my @temp = split(/\s+/,TrimSpace($_));
                   $filemap{$temp[0]} = $temp[2];
                   Trace("Undo Block Map RDBA $temp[0] Blocks $temp[2]");
                   MsgPrint("I","Undo Block Map RDBA $temp[0] Blocks $temp[2]");
                }
            }
        }
        close(GRIDINSTLOG);
    }
}

sub ParseMap
{
    my $key = shift;
    my $b=substr($key,2);
    my $fileNum  =  hex($b) >> 22;
    my $blockNum =  hex($b) & 4194303;

    Trace("Undo Block Map RDBA $key($fileNum/$blockNum)");
    MsgPrint("I","Undo Block Map RDBA $key($fileNum/$blockNum)");

    return $fileNum , $blockNum;
}

sub DumpMap
{
    my @dumpsql;
    foreach my $key (sort keys %filemap)
    {
        my ($fileNum , $blockNum) = ParseMap($key);
        for my $i ( 0 .. $filemap{$key} )
        {
            MsgPrint("I","Will Dump Datafile : $dbfname{$fileNum} Block : ".(int($blockNum) + $i));
            push (@dumpsql,"alter system dump datafile '".$dbfname{$fileNum}."' block ". (int($blockNum) + $i) . ";")
        }
    }
    my $sql = '';
    foreach(@dumpsql)
    {
        $sql =  $sql.$_."\n";
    }
    $sql = $sql."SELECT d.VALUE || '/' || LOWER(RTRIM(i.INSTANCE, CHR(0))) || '_ora_' ||
            p.spid || '.trc' trace_file_name
       FROM (SELECT p.spid
               FROM v\$mystat m, v\$session s, v\$process p
               WHERE m.statistic# = 1
                AND s.SID = m.SID
                AND p.addr = s.paddr) p,
            (SELECT t.INSTANCE
               FROM v\$thread t, v\$parameter v
              WHERE v.NAME = 'thread'
                AND (v.VALUE = '0' OR to_char(t.thread#) = v.VALUE)) i,
            (select value from v\$diag_info WHERE name='Diag Trace') d";
    # print "$sql\n";

    my @sqlResult = executeSQL($sql);
    my $tracefile = $sqlResult[0];
    MsgPrint("I","Undo Data Block Dump Trace : $tracefile");
    Trace("Undo Data Block Dump Trace : $tracefile");
    if (open(GRIDINSTLOG, "< $tracefile"))
    {
        while (<GRIDINSTLOG>)
        {
            chomp();
            next unless /\S/;
            if ($_ =~ /5f/)  # col 1改5f
            {
                # print $_."\n";
                my $line = $_;
                if (length($line) > 32)  # 12改32
                {
                    # my @undoname = split(/]/,$line);
                    # push @undosegname,TrimSpace($undoname[1]);
					my @undoname;

                    if ($line =~ /\]/) {
                        # 如果包含 `]`，按 `]` 分割
                        @undoname = split(/\]/, $line);
                        push @undosegname, TrimSpace($undoname[1]);
                    } else {
                        # 如果不包含 `]`，按空格分割
                        @undoname = split(/\s+/, $line);  # 按空格分割
                        push @undosegname, join(' ', @undoname);  # 使用空格连接所有分割的元素，保留十六进制格式
                    }
                }
            }
        }
        close(GRIDINSTLOG);
    }
}

sub converNamebySQL
{
    my $sql = '';
    foreach my $name (@undosegname)
    {
        Trace("Undo Segment Name: $name");
        $name =~ s/\s+//g;
        Trace("Covert Undo Segment Name: $name");
        my $sql1= "select UTL_RAW.CAST_TO_VARCHAR2('".$name."') from dual";
        $sql = $sql.$sql1."\nunion\n";
    }
    $sql .= "select UTL_RAW.CAST_TO_VARCHAR2('756e646f') from dual";
    my @sqlResult = executeSQL($sql);

    my $PREFIX  = "_CORRUPTED_ROLLBACK_SEGMENTS = (";
    my $FSP     = ",";
    my $POSTFIX = ")";
    my $str;
    $str = "$PREFIX";
    foreach (@sqlResult)
    {
        if ($_ =~ /SYSTEM/ || $_ =~ /undo/) {
            next
        } else {
            $str = "$str$_$FSP";
        }
    }
    if ($str =~ /$FSP$/)
    {
        chop($str);
    }
    $str = "$str$POSTFIX";
    MsgPrint("I","$str");
    # 5f535953534d55323024

}

sub converNamebyPerl
{
    my @undoRname;
    foreach my $name (@undosegname)
    {
        Trace("Undo Segment Name: $name");
        my @str1 = split (/\s+/,$name);
        my $str;
        foreach my $item (@str1)
        {
            $str.=chr(hex($item));
        }
        # print "$str\n";
        push @undoRname,$str;
    }

    my $PREFIX  = "_CORRUPTED_ROLLBACK_SEGMENTS = (";
    my $FSP     = ",";
    my $POSTFIX = ")";
    my $str;
    $str = "$PREFIX";
    foreach (@undoRname)
    {
        if ($_ =~ /SYSTEM/ || $_ =~ /undo/) {
            next
        } else {
            $str = "$str$_$FSP";
        }
    }
    if ($str =~ /$FSP$/)
    {
        chop($str);
    }
    $str = "$str$POSTFIX";
    MsgPrint("I","$str");
}
# ## <<-----------------------[ Begin Main ]----------------------------->>

ParseArgs();
InitLogfile();
CheckDBStatus();
if ($dbstatus eq 'NO') {
    DieTrap("Database Must be Mounted and Opened")
}
CheckVersion();
CheckTS();
DumpUndoSegment();
DumpMap();
# converNamebySQL();
converNamebyPerl();
