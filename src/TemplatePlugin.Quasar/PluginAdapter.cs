using System.Reflection;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Quasar.Plugin.Abstractions;
using Quasar.Plugin.Abstractions.Extensions;
using Quasar.Plugin.Abstractions.Navigation;
using Quasar.Plugin.Abstractions.Operations;
using Quasar.Plugin.Abstractions.Security;
using TemplatePlugin.Components;

namespace TemplatePlugin.Quasar;

public sealed class PluginAdapter : IQuasarPlugin
{
    public sealed record VersionRequest;

    public string Id => "template-plugin";

    public string DisplayName => "Template Plugin";

    public void ConfigureServices(IServiceCollection services, QuasarPluginContext context)
    {
        services.AddQuasarOperation<VersionRequest, string>(
            context.PluginId, "version.read", [QuasarPolicyNames.CanView],
            (_, _, _) => Task.FromResult(context.Manifest.Version),
            new QuasarOperationMetadata
            {
                Effect = QuasarOperationEffect.Read,
                Description = "Returns the installed UI package version."
            });
    }

    public void ConfigureEndpoints(IEndpointRouteBuilder endpoints, QuasarPluginContext context)
    {
    }

    public IEnumerable<Assembly> GetRazorAssemblies()
    {
        yield return typeof(EntityAction).Assembly;
    }

    public IEnumerable<QuasarNavItem> GetNavItems()
    {
        yield return new QuasarNavItem(
            DisplayName,
            "/template-plugin",
            PluginIcons.Extension,
            QuasarNavZones.Main,
            800,
            QuasarPolicyNames.CanView);
    }

    public IEnumerable<QuasarExtensionContribution> GetExtensions()
    {
        yield return new QuasarExtensionContribution(
            QuasarExtensionTargets.EntityActions,
            typeof(EntityAction),
            QuasarPatchMode.After,
            800,
            Id,
            QuasarPolicyNames.CanView);
    }
}
