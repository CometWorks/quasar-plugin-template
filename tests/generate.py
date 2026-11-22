"""Generate a renamed starter and exercise its package against a published dashboard."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import tempfile
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]


def run(*args, env=None):
    subprocess.run(args, check=True, env=env)


def check(quasar, publish):
    with tempfile.TemporaryDirectory(prefix="quasar-starter-") as scratch:
        work = Path(scratch)
        project = work / "generated"
        hive = ("--debug:custom-hive", work / "hive")
        run("dotnet", "new", "install", ROOT, *hive)
        run("dotnet", "new", "quasar-plugin", "-n", "Acme.Fleet Tools", "-o", project, *hive)

        manifest = json.loads((project / "quasar-plugin.json").read_text())
        hub = ElementTree.parse(project / "quasar-hub.xml")
        assert manifest["id"] == manifest["companionPlugins"][0]["id"] == "acme-fleet-tools"
        assert manifest["browserAssembly"] == "Acme.Fleet_Tools.dll"
        assert manifest["quasarVersion"] == hub.findtext("QuasarVersion")
        assert manifest["projectPath"] == hub.findtext("ProjectPath")
        assert (project / manifest["staticAssets"] / manifest["stylesheets"][0]).is_file()
        companion = manifest["companionPlugins"][0]
        assert (project / companion["projectPath"]).is_file()
        assert not (project / ".git").exists()

        adapter = project / manifest["projectPath"]
        run("dotnet", "build", adapter, "-c", "Release",
            f"-p:QuasarPluginAbstractionsAssembly={publish / 'Quasar.Plugin.Abstractions.dll'}")
        output = adapter.parent / "bin/Release/net10.0"
        for key in ("entryAssembly", "browserAssembly"):
            assert (output / manifest[key]).is_file()
        run("dotnet", "build", project / companion["projectPath"], "-c", "Release",
            f"-p:MagnetarProtocolAssembly={publish / 'Agent/Magnetar.Protocol.dll'}")
        run("dotnet", "publish", project / "samples/PreviewHost", "-c", "Release")

        run("dotnet", "run", "-c", "Release", "--project", quasar / "tests/Quasar.Wasm.DashboardChecks",
            env={**os.environ, "QUASAR_DASHBOARD_PUBLISH": str(publish),
                 "QUASAR_TEST_PLUGIN_PACKAGE": str(project),
                 "QUASAR_TEST_PLUGIN_DRIVER": str(project / "tests/dashboard.mjs")})


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("quasar", type=Path, help="matching Quasar source checkout")
    parser.add_argument("publish", type=Path, help="Quasar Release publish directory")
    args = parser.parse_args()
    check(args.quasar.resolve(), args.publish.resolve())
