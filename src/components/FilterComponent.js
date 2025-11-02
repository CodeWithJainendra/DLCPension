import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Typography,
  Box,
  Chip,
  Divider,
  CircularProgress,
  Collapse,
  Stack,
  Paper,
} from "@mui/material";

const FilterComponent = ({
  open,
  onClose,
  onApply,
  onReset,
  selectedFilters,
}) => {
  console.log("FilterComponent: open", open);

  const [searchTerms, setSearchTerms] = useState({});
  const [expanded, setExpanded] = useState({});
  const [localFilters, setLocalFilters] = useState(selectedFilters || {});

  const pensionerSubTypes = {
    Central: {
      key: "central",
      title: "Central",
      options: [
        "Railway",
        "Defence",
        "Central Autonomous",
        "EPFO", 
        "Civil",
        "Others",
        "Postal",
        "Telecom",
        "Defence Sparsh",
        "Other"
      ]
    },
    State: {
      key: "state",
      title: "State",
      options: ["State Govt", "State Autonomous", "Other"]
    },
    Other: {
      key: "other",
      title: "Others",
      options: ["Other"]
    }
  };

  const filterSections = {
    "banks": {
      key: "banks",
      title: "Banks",
      options: [
        "State Bank of India",
        "Punjab National Bank",
        "Union Bank of India",
        "Bank of Baroda",
        "Canara Bank",
        "Indian Bank",
        "Central Bank of India",
        "UCO Bank",
        "Bank of India",
        "Indian Overseas Bank",
        "Punjab & Sind Bank",
        "HDFC Bank",
        "ICICI Bank",
        "Axis Bank",
        "IDBI Bank",
        "Yes Bank",
        "IndusInd Bank",
        "Kotak Mahindra Bank",
      ],
    },
    "pensioner_types": {
      key: "pensioner_types",
      title: "Pensioner Types",
      options: ["Central", "State", "Other"],
      categories: {
        "central": {
          key: "central",
          title: "Central",
          options:
            ["Railway", "Defence", "Autonomous", "EPFO", "Civil", "Others", "Postal", "Telecom", "Defence Sparsh"]
        },
        "state": {
          key: "state",
          title: "State",
          options: ["State Govt", "State Autonomous", "Other State"]
        },
        "other": {
          key: "other",
          title: "Other",
          options: ["Others"]
        }
      }
    },
    "age_group": {
      key: "age_group",
      title: "Age Group",
      options: ["Below 60", "60–70", "70–80", "80–90", "Above 90"],
    },
    "data_status": {
      key: "data_status",
      title: "Pensioner Data",
      options: ["All", "Completed", "Pending", "Last year manual"],
    }
  };

  const handleOptionToggle = (key, option) => {
    const current = new Set(localFilters[key] || []);
    current.has(option) ? current.delete(option) : current.add(option);
    setLocalFilters({ ...localFilters, [key]: Array.from(current) });
  };

  const handleSelectAll = (key, options, checked) => {
    setLocalFilters({
      ...localFilters,
      [key]: checked ? [...options] : [],
    });
  };



  const handleSearchChange = (key, value) =>
    setSearchTerms({ ...searchTerms, [key]: value });

  const filteredOptions = (key, options) => {
    const term = searchTerms[key]?.toLowerCase() || "";
    return options.filter((opt) => opt.toLowerCase().includes(term));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleShowMoreToggle = (key) => {
    setExpanded({ ...expanded, [key]: !expanded[key] });
  };

  const filterOrder = ["data_status", "age_group", "banks", "pensioner_types"];
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{ sx: { borderRadius: 1 } }}
    >
      {/* Top Title with Close */}
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Filters</Typography>
        <Button onClick={onClose} color="inherit" size="small">✕</Button>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Stack spacing={2}>
          {filterOrder.map((section_name) => {
            const section = filterSections[section_name];
            let optionsList = section.options || Object.keys(section.categories);

            // Sort for banks/pensioner type/subtype
            if (["banks", "pensioner_types"].includes(section.key)) {
              optionsList = Array.isArray(optionsList) ? optionsList.slice().sort((a, b) => a.localeCompare(b)) : optionsList;
            }

            optionsList = filteredOptions(section.key, optionsList);

            const visibleCount = expanded[section.key] ? optionsList.length : 6;
            const visibleOptions = optionsList.slice(0, visibleCount);

            return (
              <Paper key={section.key} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    {section.title}
                  </Typography>

                  {/* Select All/Deselect All Checkbox */}
                  {section.key !== "pensioner_types" && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={localFilters[section.key]?.length === section.options.length}
                        indeterminate={
                          localFilters[section.key]?.length > 0 &&
                          localFilters[section.key]?.length < section.options.length
                        }
                        onChange={(e) => handleSelectAll(section.key, section.options, e.target.checked)}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        {localFilters[section.key]?.length === section.options.length ? "Deselect All" : "Select All"}
                      </Typography>
                    }
                  />
                  )}
                </Box>

                {/* Banks with search */}
                {section.key === "banks" && (
                  <>
                    <TextField
                      size="small"
                      placeholder={`Search ${section.title.toLowerCase()}...`}
                      value={searchTerms[section.key] || ""}
                      onChange={(e) => handleSearchChange(section.key, e.target.value)}
                      variant="outlined"
                      fullWidth
                      sx={{ mb: 1 }}
                    />
                    <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={0.5}>
                      {visibleOptions.map((option) => (
                        <FormControlLabel
                          key={option}
                          control={
                            <Checkbox
                              size="small"
                              checked={localFilters["banks"]?.includes(option) || false}
                              onChange={() => handleOptionToggle("banks", option)}
                            />
                          }
                          label={<Typography variant="body2">{option}</Typography>}
                        />
                      ))}
                    </Box>
                  </>
                )}

                {/* Pensioner Types & Subtypes */}
                {section.key === "pensioner_types" && (
                  <Box display="flex" flexDirection="column" gap={1}>
                    {Object.keys(section.categories).map((categoryKey) => {
                      const category = section.categories[categoryKey];
                      const selected = localFilters.pensioner_types?.[categoryKey] || [];

                      // Calculate select-all state
                      const allSelected = selected.length === category.options.length;
                      const someSelected =
                        selected.length > 0 && selected.length < category.options.length;

                      // Handle select-all toggle for each category
                      const handleCategorySelectAll = (checked) => {
                        setLocalFilters({
                          ...localFilters,
                          pensioner_types: {
                            ...localFilters.pensioner_types,
                            [categoryKey]: checked ? [...category.options] : [],
                          },
                        });
                      };

                      // Handle individual subtype toggle
                      const handleSubtypeToggle = (subtype) => {
                        const current = new Set(selected);
                        current.has(subtype) ? current.delete(subtype) : current.add(subtype);
                        setLocalFilters({
                          ...localFilters,
                          pensioner_types: {
                            ...localFilters.pensioner_types,
                            [categoryKey]: Array.from(current),
                          },
                        });
                      };

                      return (
                        <Box
                          key={categoryKey}
                          sx={{
                            borderBottom: "1px solid #eee",
                            pb: 1,
                            mb: 1,
                          }}
                        >
                          {/* Row: Title + Select All aligned horizontally */}
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "1fr auto",
                              alignItems: "center",
                              mb: 0.5,
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {category.title}
                            </Typography>

                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  checked={allSelected}
                                  indeterminate={someSelected}
                                  onChange={(e) => handleCategorySelectAll(e.target.checked)}
                                />
                              }
                              label={
                                <Typography variant="body2">
                                  {allSelected ? "Deselect All" : "Select All"}
                                </Typography>
                              }
                              sx={{ m: 0, justifySelf: "end" }}
                            />
                          </Box>

                          {/* Subtype checkboxes */}
                          <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={0.5}>
                            {category.options.map((subtype) => (
                              <FormControlLabel
                                key={subtype}
                                control={
                                  <Checkbox
                                    size="small"
                                    checked={selected.includes(subtype)}
                                    onChange={() => handleSubtypeToggle(subtype)}
                                  />
                                }
                                label={<Typography variant="body2">{subtype}</Typography>}
                              />
                            ))}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}

                {/* Generic sections: Age Group, Pensioner Data */}
                {["age_group", "data_status"].includes(section.key) && (
                  <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={0.5}>
                    {visibleOptions.map((option) => (
                      <FormControlLabel
                        key={option}
                        control={
                          <Checkbox
                            size="small"
                            checked={localFilters[section.key]?.includes(option) || false}
                            onChange={() => handleOptionToggle(section.key, option)}
                          />
                        }
                        label={<Typography variant="body2">{option}</Typography>}
                      />
                    ))}
                  </Box>
                )}

                {optionsList.length > visibleCount && (
                  <Button
                    size="small"
                    onClick={() => handleShowMoreToggle(section.key)}
                    sx={{ mt: 1 }}
                  >
                    {expanded[section.key] ? "Show Less" : `Show More (${optionsList.length - visibleCount})`}
                  </Button>
                )}
              </Paper>
            );
          })}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: "flex-end" }}>
        <Button variant="outlined" size="small" onClick={onClose}>Cancel</Button>
        <Button variant="contained" size="small" onClick={handleApply}>Apply</Button>
      </DialogActions>


    </Dialog>


  );

};

export default FilterComponent;