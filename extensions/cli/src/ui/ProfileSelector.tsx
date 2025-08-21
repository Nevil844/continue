import { Box, Text, useInput } from "ink";
import React, { useEffect, useState } from "react";

import {
  getAccessToken,
  getOrganizationId,
  isAuthenticatedConfig,
  loadAuthConfig,
  listUserOrganizations,
  logout,
  saveAuthConfig,
  AuthenticatedConfig,
} from "../auth/workos.js";
import { getApiClient } from "../config.js";

interface ProfileSelectorProps {
  onSelect?: (action: "organization" | "assistant" | "logout") => void;
  onCancel: () => void;
}

interface Organization {
  id: string | null; // null for personal
  name: string;
  slug?: string;
  icon: string;
}

const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  onSelect,
  onCancel,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [assistants, setAssistants] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Menu sections
  const menuSections = [
    { type: "organizations", title: "Organization", items: organizations },
    { type: "assistants", title: "Assistants", items: assistants },
    { type: "actions", title: "", items: [{ name: "Log out", id: "logout" }] },
  ];

  // Flatten all items for navigation
  const allItems = menuSections.reduce((acc, section) => {
    return [...acc, ...section.items.map(item => ({ ...item, section: section.type }))];
  }, [] as any[]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const authConfig = loadAuthConfig();
        if (!isAuthenticatedConfig(authConfig)) {
          setLoading(false);
          return;
        }

        setUserEmail(authConfig.userEmail);
        setCurrentOrgId(authConfig.organizationId);

        // Load organizations
        const orgs = await listUserOrganizations();
        const orgOptions: Organization[] = [
          { id: null, name: "Personal", icon: "👤" },
          ...(orgs || []).map((org) => ({
            id: org.id,
            name: org.name,
            slug: org.slug,
            icon: "◆",
          })),
        ];
        setOrganizations(orgOptions);

        // Set selected organization index
        const currentOrgIndex = orgOptions.findIndex(
          (org) => org.id === authConfig.organizationId,
        );
        if (currentOrgIndex !== -1) {
          setSelectedIndex(currentOrgIndex);
        }

        // Load assistants for current organization
        const accessToken = getAccessToken(authConfig);
        if (accessToken) {
          const apiClient = getApiClient(accessToken);
          try {
            const assistantList = await apiClient.listAssistants({
              alwaysUseProxy: "false",
              organizationId: authConfig.organizationId ?? undefined,
            });

            const assistantOptions = [
              ...assistantList.map((assistant) => ({
                id: assistant.packageSlug,
                name: `${assistant.ownerSlug}/${assistant.packageSlug}`,
                slug: `${assistant.ownerSlug}/${assistant.packageSlug}`,
                icon: "🤖",
              })),
              {
                id: "new",
                name: "+ New Assistant",
                icon: "➕",
                action: "create",
              },
              {
                id: "reload",
                name: "Reload assistants",
                icon: "🔄",
                action: "reload",
              },
            ];
            setAssistants(assistantOptions);
          } catch (err) {
            console.error("Failed to load assistants:", err);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Failed to load profile data:", error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }

    if (key.upArrow) {
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    } else if (key.downArrow) {
      setSelectedIndex(Math.min(allItems.length - 1, selectedIndex + 1));
    } else if (key.return) {
      const selectedItem = allItems[selectedIndex];
      if (!selectedItem) return;

      if (selectedItem.section === "organizations") {
        // Switch organization
        switchOrganization(selectedItem.id);
      } else if (selectedItem.section === "assistants") {
        if (selectedItem.action === "create") {
          onSelect?.("assistant");
        } else if (selectedItem.action === "reload") {
          // Reload assistants (could trigger a refresh)
          window.location.reload();
        } else {
          // Select assistant
          onSelect?.("assistant");
        }
      } else if (selectedItem.id === "logout") {
        logout();
        onSelect?.("logout");
      }
      onCancel(); // Close after selection
    }
  });

  const switchOrganization = async (orgId: string | null) => {
    try {
      const authConfig = loadAuthConfig();
      if (!isAuthenticatedConfig(authConfig)) return;

      const updatedConfig: AuthenticatedConfig = {
        ...authConfig,
        organizationId: orgId,
      };

      saveAuthConfig(updatedConfig);
      setCurrentOrgId(orgId);
      onSelect?.("organization");
    } catch (error) {
      console.error("Failed to switch organization:", error);
    }
  };

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text>Loading profile...</Text>
      </Box>
    );
  }

  let itemIndex = 0;

  return (
    <Box
      flexDirection="column"
      padding={1}
      borderStyle="single"
      borderColor="gray"
    >
      {/* Header with email */}
      <Box marginBottom={1}>
        <Text bold color="white">
          {userEmail}
        </Text>
      </Box>

      {/* Organization section */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="gray">
          Organization
        </Text>
        {organizations.map((org) => {
          const isSelected = selectedIndex === itemIndex;
          const isCurrent = org.id === currentOrgId;
          itemIndex++;

          return (
            <Box key={org.id || "personal"} flexDirection="row" gap={1}>
              <Text color={isSelected ? "black" : "white"} backgroundColor={isSelected ? "white" : "black"}>
                {org.icon} {org.name}
                {isCurrent && " ✓"}
                {isSelected && " →"}
              </Text>
            </Box>
          );
        })}
      </Box>

      {/* Assistant section */}
      {assistants.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="gray">
            Assistants
          </Text>
          {assistants.map((assistant) => {
            const isSelected = selectedIndex === itemIndex;
            itemIndex++;

            return (
              <Box key={assistant.id} flexDirection="row" gap={1}>
                <Text color={isSelected ? "black" : "white"} backgroundColor={isSelected ? "white" : "black"}>
                  {assistant.icon} {assistant.name}
                  {isSelected && " →"}
                </Text>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Actions */}
      <Box flexDirection="column">
        {menuSections
          .filter((section) => section.type === "actions")
          .map((section) =>
            section.items.map((item) => {
              const isSelected = selectedIndex === itemIndex;
              itemIndex++;

              return (
                <Box key={item.id} flexDirection="row" gap={1}>
                  <Text color={isSelected ? "black" : "white"} backgroundColor={isSelected ? "white" : "black"}>
                    {item.name}
                    {isSelected && " →"}
                  </Text>
                </Box>
              );
            }),
          )}
      </Box>

      {/* Footer with keyboard shortcut */}
      <Box marginTop={1} borderTop borderColor="gray">
        <Text color="gray" dimColor>
          ⌘A to toggle assistant
        </Text>
      </Box>
    </Box>
  );
};

export { ProfileSelector };