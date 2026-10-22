; Script for Inno Setup Compiler 6 (64-bit Edition)
; Application: Digital Bell - School Automatic Bell System
; Author & Designer: Nagji Yadav Sakodara (9982151938)
; Compatibility: Windows 7 SP1 (64-bit), Windows 8, Windows 8.1, Windows 10, Windows 11 (64-bit)

#define MyAppName "Digital Bell"
#define MyAppDisplayName "Digital Bell - स्वचालित विद्यालय घंटी प्रणाली (64-bit)"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "नगजी यादव साकोदरा (Nagji Yadav Sakodara)"
#define MyAppPublisherPhone "9982151938"
#define MyAppExeName "Digital Bell.exe"

[Setup]
; Unique Application ID for Windows Control Panel -> Programs and Features
AppId={{E2722137-0A92-5CB3-AE19-835BF3F1D102}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppDisplayName} v{#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL=tel:{#MyAppPublisherPhone}
AppSupportURL=tel:{#MyAppPublisherPhone}
AppUpdatesURL=tel:{#MyAppPublisherPhone}
AppComments=राजस्थान सरकारी विद्यालय (शिविरा पंचांग नियमानुसार) स्वचालित घंटी प्रणाली | डिज़ाइनर: नगजी यादव साकोदरा (9982151938)
AppContact={#MyAppPublisherPhone}
DefaultDirName={autopf64}\Digital Bell
DefaultGroupName=Digital Bell
AllowNoIcons=yes
ArchitecturesInstallIn64BitMode=x64
ArchitecturesAllowed=x64

; Windows Control Panel (Add/Remove Programs) Registration Settings
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppDisplayName}

Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
WizardSizePercent=115
; Full Windows 7 SP1 to Windows 11 Compatibility
MinVersion=6.1sp1
OutputDir=..\release
OutputBaseFilename=Digital_Bell_Setup_x64
SetupIconFile=..\build\icon.ico
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
CloseApplications=yes
RestartApplications=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "autostart"; Description: "विंडोज चालू होते ही स्वतः प्रारंभ करें (Start automatically on Windows boot)"; GroupDescription: "ऑटो-स्टार्ट सेटिंग्स (Auto-Start):"

[Files]
Source: "..\installer\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppDisplayName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\उपयोगकर्ता पुस्तिका (User Manual)"; Filename: "{app}\raw_web\USER_MANUAL_HINDI.html"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppDisplayName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon
; Windows Startup shortcut for auto-boot
Name: "{userstartup}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Parameters: "--hidden"; Tasks: autostart

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#MyAppDisplayName}}"; Flags: nowait postinstall skipifsilent

[Registry]
; Extended metadata in Control Panel Uninstall registry
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Uninstall\{#SetupSetting("AppId")}_is1"; ValueType: string; ValueName: "Contact"; ValueData: "{#MyAppPublisherPhone}"; Flags: uninsdeletekeyifempty
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Uninstall\{#SetupSetting("AppId")}_is1"; ValueType: string; ValueName: "HelpTelephone"; ValueData: "{#MyAppPublisherPhone}"; Flags: uninsdeletekeyifempty
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Uninstall\{#SetupSetting("AppId")}_is1"; ValueType: string; ValueName: "Readme"; ValueData: "{app}\raw_web\USER_MANUAL_HINDI.html"; Flags: uninsdeletekeyifempty
