import React, { Fragment, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/Auth";
import { IdeMessengerContext } from "../../context/IdeMessenger";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { updateConfig } from "../../redux/slices/configSlice";
import { ConfigYaml, parseConfigYaml } from "@continuedev/config-yaml";
import { MCPServerStatus } from "core";
import {
  ArrowPathIcon,
  CircleStackIcon,
  CommandLineIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
  FolderIcon,
  ArrowLeftIcon,
  CubeIcon,
  PencilIcon,
  BookOpenIcon,
  ChatBubbleBottomCenterIcon,
  Squares2X2Icon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { ToolTip } from "../gui/Tooltip";
import { Button } from "../ui";
import { fontSize } from "../../util";
import { ROUTES } from "../../util/navigation";

interface MCPServerStatusProps {
  server: MCPServerStatus;
  serverFromYaml?: NonNullable<ConfigYaml["mcpServers"]>[number];
}

function MCPServerEntry({ server, serverFromYaml }: MCPServerStatusProps) {
  const ideMessenger = useContext(IdeMessengerContext);
  const config = useAppSelector((store) => store.config.config);
  const dispatch = useAppDispatch();

  const updateMCPServerStatus = (status: MCPServerStatus["status"]) => {
    dispatch(
      updateConfig({
        ...config,
        mcpServerStatuses: config.mcpServerStatuses.map((s) =>
          s.id === server.id
            ? {
                ...s,
                status,
              }
            : s,
        ),
      }),
    );
  };

  const onAuthenticate = async () => {
    updateMCPServerStatus("authenticating");
    await ideMessenger.request("mcp/startAuthentication", server);
  };

  const onRemoveAuth = async () => {
    updateMCPServerStatus("authenticating");
    await ideMessenger.request("mcp/removeAuthentication", server);
  };

  const onRefresh = async () => {
    updateMCPServerStatus("connecting");
    ideMessenger.post("mcp/reloadServer", {
      id: server.id,
    });
  };

  return (
    <div className="bg-vsc-input-background rounded-lg p-4 mb-4">
      {/* Server name and status indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">{server.name}</h3>
          {server.errors.length > 0 && (
            <InformationCircleIcon
              className={`h-5 w-5 ${
                server.status === "error" ? "text-red-500" : "text-yellow-500"
              }`}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {server.isProtectedResource && (
            <div
              className="text-lightgray flex cursor-pointer items-center hover:text-white hover:opacity-80"
              onClick={server.status === "error" ? onAuthenticate : onRemoveAuth}
            >
              {server.status === "error" ? (
                <ShieldExclamationIcon className="h-5 w-5" />
              ) : (
                <ShieldCheckIcon className="h-5 w-5" />
              )}
            </div>
          )}
          <PencilIcon className="h-4 w-4 text-lightgray cursor-pointer hover:text-white" />
          <ArrowPathIcon
            className="h-4 w-4 text-lightgray cursor-pointer hover:text-white"
            onClick={onRefresh}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <XMarkIcon className="h-4 w-4 text-lightgray" />
            <span className="text-sm font-medium">
              {server.tools.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <FolderIcon className="h-4 w-4 text-lightgray" />
            <span className="text-sm font-medium">
              {server.resources.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <CircleStackIcon className="h-4 w-4 text-lightgray" />
            <span className="text-sm font-medium">
              {server.resourceTemplates.length}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ArrowLeftIcon className="h-4 w-4 text-lightgray" />
        </div>
      </div>
    </div>
  );
}

function MCPServersPage() {
  const navigate = useNavigate();
  const servers = useAppSelector(
    (store) => store.config.config.mcpServerStatuses,
  );
  const { selectedProfile } = useAuth();

  // Mock data for demonstration - matching the screenshot
  const mockServers = [
    {
      id: "linear-mcp",
      name: "Linear MCP",
      status: "connected" as const,
      tools: Array(24).fill(null).map((_, i) => ({ name: `tool-${i}` })),
      resources: [],
      resourceTemplates: [],
      prompts: [],
      errors: [],
      isProtectedResource: false,
      sourceFile: "config.yaml",
    },
    {
      id: "sentry-mcp",
      name: "Sentry MCP",
      status: "error" as const,
      tools: [],
      resources: [],
      resourceTemplates: [],
      prompts: [],
      errors: ["Connection failed"],
      isProtectedResource: true,
      sourceFile: "config.yaml",
    },
    {
      id: "deepwiki-mcp",
      name: "DeepWiki MCP",
      status: "connected" as const,
      tools: Array(3).fill(null).map((_, i) => ({ name: `tool-${i}` })),
      resources: [],
      resourceTemplates: [],
      prompts: [],
      errors: [],
      isProtectedResource: false,
      sourceFile: "config.yaml",
    },
    {
      id: "context7-mcp",
      name: "Context7 MCP",
      status: "connected" as const,
      tools: Array(2).fill(null).map((_, i) => ({ name: `tool-${i}` })),
      resources: [],
      resourceTemplates: [],
      prompts: [],
      errors: [],
      isProtectedResource: false,
      sourceFile: "config.yaml",
    },
  ];

  const mergedBlocks = useMemo(() => {
    const parsed = selectedProfile?.rawYaml
      ? parseConfigYaml(selectedProfile?.rawYaml ?? "")
      : undefined;
    
    // Use mock data if no real servers exist
    const serversToUse = servers?.length ? servers : mockServers;
    
    return serversToUse.map((doc, index) => ({
      block: doc,
      blockFromYaml: parsed?.mcpServers?.[index],
    }));
  }, [servers, selectedProfile]);

  return (
    <div className="flex flex-col h-full">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between p-4 border-b border-vsc-input-border">
        <div className="flex items-center gap-4">
          <ArrowLeftIcon 
            className="h-6 w-6 text-lightgray cursor-pointer hover:text-white" 
            onClick={() => navigate(ROUTES.HOME)}
          />
          <div className="flex items-center gap-3">
            <CubeIcon className="h-5 w-5 text-lightgray" />
            <PencilIcon className="h-5 w-5 text-lightgray" />
            <BookOpenIcon className="h-5 w-5 text-lightgray" />
            <ChatBubbleBottomCenterIcon className="h-5 w-5 text-lightgray" />
            <Squares2X2Icon className="h-5 w-5 text-lightgray" />
            <span className="px-3 py-1 bg-vsc-button-background rounded-md text-sm font-medium text-white">
              MCP
            </span>
          </div>
        </div>
        <UserCircleIcon className="h-8 w-8 text-lightgray cursor-pointer hover:text-white" />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {mergedBlocks.map(({ block, blockFromYaml }, idx) => (
            <MCPServerEntry
              key={idx}
              server={block}
              serverFromYaml={blockFromYaml}
            />
          ))}
          
          {/* Explore MCP Servers Button */}
          <button className="w-full mt-4 p-4 bg-gray-600 hover:bg-gray-500 rounded-lg flex items-center justify-center gap-2 text-white">
            <PencilIcon className="h-4 w-4" />
            <span>Explore MCP Servers</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default MCPServersPage;