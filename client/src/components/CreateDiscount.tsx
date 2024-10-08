import React, { useState, useEffect } from "react";
import Select from "react-select/dist/declarations/src/Select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  CalendarIcon,
  MinusCircleIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/solid";
import TextareaAutosize from "react-textarea-autosize";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z, ZodError } from "zod";
import axios from "axios";
import RequestSuccessModal from "./Modals/RequestSuccessModal";
import ClipLoader from "react-spinners/ClipLoader";
import AddCustomModal from "./AddCustomModal";
import { table } from "console";
import Swal from "sweetalert2";
type CustomApprover = {
  id: number;
  name: string;
  approvers: {
    noted_by: { name: string }[];
    approved_by: { name: string }[];
  };
};
interface Approver {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
}
type Props = {};
const requestType = [
  { title: "Stock Requisition", path: "/request/sr" },
  { title: "Purchase Order Requisition Slip", path: "/request/pors" },
  { title: "Cash Disbursement Requisition Slip", path: "/request/cdrs" },
  { title: "Application For Cash Advance", path: "/request/afca" },
  { title: "Liquidation of Actual Expense", path: "/request/loae" },
  { title: "Request for Refund", path: "/request/rfr" },
  { title: "Discount Request", path: "/request/dr" },
];
const schema = z.object({
  cashAmount: z.string(),
  liquidationDate: z.string(),
  emp_status: z.string(),
  remarks: z.string(),
  totalBoatFare: z.string(),
  totalHotel: z.string(),
  totalPerDiem: z.string(),
  totalFare: z.string(),
  totalContingency: z.string(),
  totalAmount: z.string(),
  approver_list_id: z.number(),
  approver: z.string(),
  items: z.array(
    z.object({
      brand: z.string().min(1, "Brand is required"),
      model: z.string().min(1, "Model is required"),
      unit: z.string().min(1, "Unit/Part/Job Description is required"),
      partno: z.string().optional(),
      labor: z.string().optional(),
      // spotcash: z.string().min(1, "Spot cash is required"),
      discountedPrice: z.string().min(1, "Discounted price is required"),
    })
  ),
});

const brancheList = [
  "Branch A",
  "Branch B",
  "Branch C",
  "Branch D",
  "Branch E",
];
type FormData = z.infer<typeof schema>;
type TableDataItem = {
  brand: string;
  model: string;
  unit: string;
  partno: string;
  labor: string;
  spotcash: string;
  discountedPrice: string;
};

const initialTableData: TableDataItem[] = Array.from({ length: 1 }, () => ({
  brand: "",
  model: "",
  unit: "",
  partno: "",
  labor: "",
  spotcash: "",
  discountedPrice: "",
}));

const tableStyle = "border border-black p-2";
const inputStyle =
  "w-full  border-2 rounded-[12px] pl-[10px] bg-white  autofill-input focus:outline-0";
const inputStyle2 =
  "w-full   rounded-[12px] pl-[10px] bg-white  autofill-input focus:outline-0";
const tableInput =
  "w-full h-full bg-white px-2 py-1 bg-white  autofill-input focus:outline-0";
const itemDiv = "flex flex-col ";
const buttonStyle = "h-[45px] w-[150px] rounded-[12px] text-white";
const CreateDiscount = (props: Props) => {
  const [totalBoatFare, setTotalBoatFare] = useState(0);
  const [totalHotel, setTotalHotel] = useState(0);
  const [formData, setFormData] = useState<any>(null);
  const [totalFare, setTotalFare] = useState(0);
  const [totalContingency, setTotalContingency] = useState(0);
  const [startDate, setStartDate] = useState(new Date());
  const navigate = useNavigate();
  const [file, setFile] = useState<File[]>([]);
  const [customApprovers, setCustomApprovers] = useState<CustomApprover[]>([]);
  const [selectedApproverList, setSelectedApproverList] = useState<
    number | null
  >(null);
  const [totalAmount, setTotalAmount] = useState({
    totalLabor: 0,
    totalSpotCash: 0,
    totalDiscountedPrice: 0,
  });
  const [selectedApprover, setSelectedApprover] = useState<{ name: string }[]>(
    []
  );
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Convert FileList to array and set it
      setFile(Array.from(e.target.files));
    }
  };
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [notedBy, setNotedBy] = useState<Approver[]>([]);
  const [approvedBy, setApprovedBy] = useState<Approver[]>([]);
  const [initialNotedBy, setInitialNotedBy] = useState<Approver[]>([]);
  const [initialApprovedBy, setInitialApprovedBy] = useState<Approver[]>([]);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    formState: { errors: formErrors },
  } = useForm<FormData>();
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const [items, setItems] = useState<
    {
      brand: string;
      model: string;
      unit: string;
      partno: string;
      labor: string;
      spotcash: string;
      discountedPrice: string;
    }[]
  >([
    {
      brand: "",
      model: "",
      unit: "",
      partno: "",
      labor: "",
      spotcash: "",
      discountedPrice: "",
    },
  ]);

  useEffect(() => {
    setInitialNotedBy(notedBy);
    setInitialApprovedBy(approvedBy);
  }, [notedBy, approvedBy]);
  /*  const fetchCustomApprovers = async () => {
    try {
      const id = localStorage.getItem("id");
      const token = localStorage.getItem("token");
      if (!token || !id) {
        console.error("Token or user ID is missing");
        return;
      }

      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/custom-approvers/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (Array.isArray(response.data.data)) {
        setCustomApprovers(response.data.data);
      } else {
        console.error("Unexpected response format:", response.data);
        setCustomApprovers([]); // Ensure that customApprovers is always an array
      }
    } catch (error) {
      console.error("Error fetching custom approvers:", error);
      setCustomApprovers([]); // Ensure that customApprovers is always an array
    }
  }; */
  const getTotalAmount = () => {
    const totalLabor = tableData.reduce(
      (acc, item) => acc + Number(item.labor || 0),
      0
    );
    const totalSpotCash = tableData.reduce(
      (acc, item) => acc + Number(item.spotcash || 0),
      0
    );
    const totalDiscountedPrice = tableData.reduce(
      (acc, item) => acc + Number(item.discountedPrice || 0),
      0
    );

    return { totalLabor, totalSpotCash, totalDiscountedPrice };
  };

  const handleOpenConfirmationModal = () => {
    setShowConfirmationModal(true);
  };

  // Function to close the confirmation modal
  const handleCloseConfirmationModal = () => {
    setShowConfirmationModal(false);
  };
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>();

  const inputStyle =
    "w-full max-w-[300px] border-2 border-black rounded-[12px] pl-[10px] bg-white";
  const [tableData, setTableData] = useState<TableDataItem[]>(initialTableData);
  const [selectedRequestType, setSelectedRequestType] = useState("/request/dr");

  const handleChange = (
    index: number,
    field: keyof TableDataItem,
    value: string
  ) => {
    const newData = [...tableData];
    newData[index][field] = value;

    // Validation for required fields 'brand' and 'model'
    if (field === "brand" || field === "model") {
      if (!value.trim()) {
        setValidationErrors((prevErrors) => ({
          ...prevErrors,
          [`items.${index}.${field}`]: "This field is required",
        }));
      } else {
        setValidationErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors[`items.${index}.${field}`];
          return newErrors;
        });
      }
    }

    // Update table data
    setItems(newData);

    // Calculate total amounts for labor, spotcash, and discountedPrice
    const totalLabor = newData.reduce(
      (acc, item) => acc + (parseFloat(item.labor) || 0),
      0
    );
    const totalSpotCash = newData.reduce(
      (acc, item) => acc + (parseFloat(item.spotcash) || 0),
      0
    );
    const totalDiscountedPrice = newData.reduce(
      (acc, item) => acc + (parseFloat(item.discountedPrice) || 0),
      0
    );

    // Update total amounts in the state
    setTotalAmount({
      totalLabor,
      totalSpotCash,
      totalDiscountedPrice,
    });
  };

  useEffect(() => {
    const totals = getTotalAmount();
    setTotalAmount(totals);
  }, [tableData]);
  const handleAddRow = () => {
    setTableData([
      ...tableData,
      {
        brand: "",
        model: "",
        unit: "",
        partno: "",
        labor: "",
        spotcash: "",
        discountedPrice: "",
      },
    ]);
  };

  const handleRemoveItem = () => {
    if (tableData.length > 1) {
      Swal.fire({
        title: "Are you sure?",
        text: "This item will be removed!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, remove it!",
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          const updatedItems = [...tableData];
          updatedItems.pop();
          setTableData(updatedItems);
        }
      });
    }
  };

  useEffect(() => {
    setTableData([
      {
        brand: "",
        model: "",
        unit: "",
        partno: "",
        labor: "",
        spotcash: "",
        discountedPrice: "",
      },
    ]);
  }, [selectedRequestType]);

  const handleAddItem = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent form submission

    setTableData([
      ...tableData,
      {
        brand: "",
        model: "",
        unit: "",
        partno: "",
        labor: "",
        spotcash: "",
        discountedPrice: "",
      },
    ]);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("id");
      const branch_code = localStorage.getItem("branch_code");
      if (items.some((item) => !item.brand || !item.model || !item.unit)) {
        return;
      }
      if (!token || !userId) {
        console.error("Token or userId not found");
        return;
      }
      if (notedBy.length === 0 || approvedBy.length === 0) {
        Swal.fire({
          icon: "error",
          title: "No approver selected",
          text: "Please select an approver. To proceed, click on 'Add Approver' button above and select an approver from list.",
          confirmButtonText: "Close",
          confirmButtonColor: "#007bff",
        });
        setLoading(false); // Stop loading state
        return; // Prevent form submission
      }
      if (notedBy.length === 0 || approvedBy.length === 0) {
        Swal.fire({
          icon: "error",
          title: "No approver selected",
          text: "Please select an approver. To proceed, click on 'Add Approver' button above and select an approver from list.",
          confirmButtonText: "Close",
          confirmButtonColor: "#007bff",
        });
        setLoading(false); // Stop loading state
        return; // Prevent form submission
      }
      // Calculate total per diem

      // Calculate total amount

      // Validate if any item fields are empty

      const formData = new FormData();

      file.forEach((file) => {
        formData.append("attachment[]", file); // Use "attachment[]" to handle multiple files
      });
      const notedByIds = Array.isArray(notedBy)
        ? notedBy.map((person) => person.id)
        : [];
      const approvedByIds = Array.isArray(approvedBy)
        ? approvedBy.map((person) => person.id)
        : [];
      formData.append("noted_by", JSON.stringify(notedByIds));
      formData.append("approved_by", JSON.stringify(approvedByIds));
      formData.append("form_type", "Discount Requisition Form");
      formData.append("user_id", userId);

      formData.append(
        "form_data",
        JSON.stringify([
          {
            branch: branch_code,
            employement_status: data.emp_status,
            total_labor: totalAmount.totalLabor,
            total_spotcash: totalAmount.totalSpotCash,
            total_discount: totalAmount.totalDiscountedPrice,
            remarks: data.remarks,
            items: items.map((item) => ({
              brand: item.brand,
              model: item.model,
              unit: item.unit,
              partno: item.partno,
              labor: item.labor,
              spotcash: item.spotcash,
              discountedPrice: item.discountedPrice,
            })),
          },
        ])
      );

      logFormData(formData);

      // Display confirmation modal
      setShowConfirmationModal(true);

      // Set form data to be submitted after confirmation
      setFormData(formData);
    } catch (error) {
      console.error("An error occurred while submitting the request:", error);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  const openAddCustomModal = () => {
    setIsModalOpen(true);
  };
  const closeAddCustomModal = () => {
    setIsModalOpen(false);
  };
  const handleOpenAddCustomModal = () => {
    setShowAddCustomModal(true);
  };

  const handleCloseAddCustomModal = () => {
    setShowAddCustomModal(false);
  };
  const handleAddCustomData = (notedBy: Approver[], approvedBy: Approver[]) => {
    setNotedBy(notedBy);
    setApprovedBy(approvedBy);
  };
  const handleConfirmSubmit = async () => {
    // Close the confirmation modal
    setShowConfirmationModal(false);
    const token = localStorage.getItem("token");

    if (!notedBy && !approvedBy) {
      Swal.fire({
        icon: "error",
        title: "No approver selected",
        text: "Please select an approver. To proceed, click on 'Add Approver' button above and select an approver from list.",
        confirmButtonText: "Close",
        confirmButtonColor: "#007bff",
      });
      return; // Prevent form submission
    }

    try {
      setLoading(true);
      logFormData(formData);

      // Perform the actual form submission
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/create-request`,
        formData, // Use the formData stored in state
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setShowSuccessModal(true);

      setFormSubmitted(true);
      setLoading(false);
    } catch (error) {
      console.error("An error occurred while submitting the request:", error);
    } finally {
      setLoading(false);
    }
  };

  const logFormData = (formData: any) => {
    for (let [key, value] of formData.entries()) {
    }
  };

  const handleBoatFareChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTotalBoatFare(parseFloat(e.target.value) || 0);
  };

  // Function to handle change in totalHotel input
  const handleHotelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTotalHotel(parseFloat(e.target.value) || 0);
  };

  // Function to handle change in totalFare input
  const handleFareChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTotalFare(parseFloat(e.target.value) || 0);
  };

  // Function to handle change in totalContingency input
  const handleContingencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTotalContingency(parseFloat(e.target.value) || 0);
  };

  const handleCancelSubmit = () => {
    // Close the confirmation modal
    setShowConfirmationModal(false);
    // Reset formData state
    setFormData(null);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);

    navigate("/request");
  };

  const handleFormSubmit = () => {
    setFormSubmitted(true);
  };
  const handleTextareaHeight = (index: number, field: string) => {
    const textarea = document.getElementById(
      `${field}-${index}`
    ) as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = "auto"; // Reset to auto height first
      textarea.style.height = `${Math.max(textarea.scrollHeight, 100)}px`; // Set to scroll height or minimum 100px
    }
  };

  return (
    <div className="bg-graybg dark:bg-blackbg w-full h-full pt-[15px] inline-flex flex-col px-[30px] pb-[15px]">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
          <ClipLoader color="#007bff" />
        </div>
      )}
      <h1 className="text-primary text-[32px] font-bold inline-block">
        Create Request
      </h1>
      <select
        className="w-2/5 lg:h-[56px] md:h-10 p-2 bg-gray-200 pl-[30px] border-2 border-black rounded-xl mb-2"
        value={selectedRequestType}
        onChange={(e) => {
          setSelectedRequestType(e.target.value);
          navigate(e.target.value);
        }}
      >
        <option value="" disabled>
          Type of request
        </option>
        {requestType.map((item) => (
          <option key={item.title} value={item.path}>
            {item.title}
          </option>
        ))}
      </select>
      <div className="bg-white w-full   mb-5 rounded-[12px] flex flex-col">
        <div className="border-b flex justify-between flex-col px-[30px] md:flex-row ">
          <div>
            <h1 className=" text-[24px] text-left py-4 text-primary font-bold flex mr-2">
              <span className="mr-2 underline decoration-2 underline-offset-8">
                Discount
              </span>{" "}
              Requisition Form
            </h1>
          </div>
          <div className="my-2 ">
            <button
              onClick={openAddCustomModal}
              className="p-2 text-white rounded bg-primary"
            >
              Add Approver
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-[35px] mt-4 ">
            <div className="grid justify-between gap-8 xl:grid-cols-4 md:grid-cols-2 ">
              <div className="flex flex-col justify-between sm:flex-row">
                <div className="">
                  <p className="font-bold">Purpose:</p>
                  <div className="flex flex-col mt-2 space-y-2 ">
                    <div className="inline-flex items-center">
                      <label
                        className="relative flex items-center cursor-pointer"
                        htmlFor="repair_maintenance"
                      >
                        <input
                          type="radio"
                          id="proba"
                          value="Proba"
                          className="w-5 h-5 ml-1 transition-all border rounded-full appearance-none cursor-pointer size-4 peer border-slate-300 checked:border-slate-400"
                          {...register("emp_status", { required: true })}
                        />
                        <span
                          className="absolute bg-blue-800 w-3.5 h-3.5 rounded-full opacity-0 ml-0.5 peer-checked:opacity-100 transition-opacity duration-200 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                          style={{ pointerEvents: "none" }} // Prevent span from blocking click events
                        ></span>
                      </label>
                      <label
                        className="ml-2 font-semibold cursor-pointer"
                        htmlFor="proba"
                      >
                        PROBA
                      </label>
                    </div>
                    <div className="inline-flex items-center">
                      <label
                        className="relative flex items-center cursor-pointer"
                        htmlFor="repair_maintenance"
                      >
                        <input
                          type="radio"
                          id="regular"
                          value="Regular"
                          className="w-5 h-5 ml-1 transition-all border rounded-full appearance-none cursor-pointer size-4 peer border-slate-300 checked:border-slate-400"
                          {...register("emp_status", { required: true })}
                        />
                        <span
                          className="absolute bg-blue-800 w-3.5 h-3.5 rounded-full opacity-0 ml-0.5 peer-checked:opacity-100 transition-opacity duration-200 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                          style={{ pointerEvents: "none" }} // Prevent span from blocking click events
                        ></span>
                      </label>
                      <label
                        className="ml-2 font-semibold cursor-pointer"
                        htmlFor="regular"
                      >
                        REGULAR
                      </label>
                    </div>
                  </div>
                  {errors.emp_status && formSubmitted && (
                    <p className="text-red-500">Purpose is required</p>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full mt-4 overflow-x-auto md:overflow-auto">
              <div className="w-full border border-collapse border-black">
                <div className="table-container">
                  <table className="w-full border border-collapse border-black">
                    <thead className="bg-[#8EC7F7]">
                      <tr>
                        <th className={`${tableStyle}`}>Brand</th>
                        <th className={`${tableStyle}`}>Model</th>
                        <th className={`${tableStyle}`}>
                          Unit/Part/Job/Description
                        </th>
                        <th className={`${tableStyle}`}>
                          Part NO./Job Order No.
                        </th>
                        <th className={`${tableStyle}`}>Labor Charge</th>
                        <th className={`${tableStyle}`}>Net Spotcash</th>
                        <th className={`${tableStyle}`}>Discounted Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((item, index) => (
                        <tr key={index} className="border border-black">
                          {/* Brand Input */}
                          <td className="p-1 border border-black">
                            <input
                              type="text"
                              value={item.brand}
                              onChange={(e) =>
                                handleChange(index, "brand", e.target.value)
                              }
                              className={`${inputStyle2}`}
                              style={{ minHeight: "50px", maxHeight: "400px" }}
                              onFocus={() =>
                                handleTextareaHeight(index, "brand")
                              }
                              onBlur={() =>
                                handleTextareaHeight(index, "brand")
                              }
                              onInput={() =>
                                handleTextareaHeight(index, "brand")
                              }
                            />
                            {/* Error Handling */}
                            {validationErrors[`items.${index}.brand`] &&
                              formSubmitted && (
                                <p className="text-red-500">
                                  {validationErrors[`items.${index}.brand`]}
                                </p>
                              )}
                            {!item.brand &&
                              formSubmitted &&
                              !validationErrors[`items.${index}.brand`] && (
                                <p className="text-red-500">Brand Required</p>
                              )}
                          </td>

                          {/* Other Columns */}
                          {/* Model Input */}
                          <td className="p-1 border border-black">
                            <input
                              type="text"
                              value={item.model}
                              onChange={(e) =>
                                handleChange(index, "model", e.target.value)
                              }
                              className={`${inputStyle2}`}
                              style={{ minHeight: "50px", maxHeight: "400px" }}
                              onFocus={() =>
                                handleTextareaHeight(index, "model")
                              }
                              onBlur={() =>
                                handleTextareaHeight(index, "model")
                              }
                              onInput={() =>
                                handleTextareaHeight(index, "model")
                              }
                            />
                            {validationErrors[`items.${index}.model`] &&
                              formSubmitted && (
                                <p className="text-red-500">
                                  {validationErrors[`items.${index}.model`]}
                                </p>
                              )}
                            {!item.model &&
                              formSubmitted &&
                              !validationErrors[`items.${index}.model`] && (
                                <p className="text-red-500">Model Required</p>
                              )}
                          </td>

                          {/* Unit Input */}
                          <td className="p-1 border border-black">
                            <textarea
                              value={item.unit}
                              onChange={(e) =>
                                handleChange(index, "unit", e.target.value)
                              }
                              className={`${inputStyle2}`}
                              style={{ minHeight: "50px", maxHeight: "400px" }}
                              onFocus={() =>
                                handleTextareaHeight(index, "unit")
                              }
                              onBlur={() => handleTextareaHeight(index, "unit")}
                              onInput={() =>
                                handleTextareaHeight(index, "unit")
                              }
                            />
                            {validationErrors[`items.${index}.unit`] &&
                              formSubmitted && (
                                <p className="text-red-500">
                                  {validationErrors[`items.${index}.unit`]}
                                </p>
                              )}
                            {!item.unit &&
                              formSubmitted &&
                              !validationErrors[`items.${index}.unit`] && (
                                <p className="text-red-500">Unit Required</p>
                              )}
                          </td>

                          {/* Part No Input */}
                          <td className="p-1 border border-black">
                            <textarea
                              value={item.partno}
                              onChange={(e) =>
                                handleChange(index, "partno", e.target.value)
                              }
                              className={`${tableInput}`}
                              style={{ minHeight: "50px", maxHeight: "400px" }}
                              onFocus={() =>
                                handleTextareaHeight(index, "partno")
                              }
                              onBlur={() =>
                                handleTextareaHeight(index, "partno")
                              }
                              onInput={() =>
                                handleTextareaHeight(index, "partno")
                              }
                            />
                          </td>

                          {/* Labor Charge Input */}
                          <td className="p-1 border border-black">
                            <input
                              type="number"
                              value={item.labor}
                              onChange={(e) =>
                                handleChange(index, "labor", e.target.value)
                              }
                              className={`${tableInput}`}
                            />
                          </td>

                          {/* Spotcash Input */}
                          <td className="p-1 border border-black">
                            <input
                              type="number"
                              value={item.spotcash}
                              onChange={(e) =>
                                handleChange(index, "spotcash", e.target.value)
                              }
                              className={`${tableInput}`}
                            />
                            {validationErrors[`items.${index}.spotcash`] &&
                              formSubmitted && (
                                <p className="text-red-500">
                                  {validationErrors[`items.${index}.spotcash`]}
                                </p>
                              )}
                            {!item.spotcash &&
                              formSubmitted &&
                              !validationErrors[`items.${index}.spotcash`] && (
                                <p className="text-red-500">
                                  Spot Cash Required
                                </p>
                              )}
                          </td>

                          {/* Discounted Price Input */}
                          <td className="p-1 border border-black">
                            <input
                              type="number"
                              value={item.discountedPrice}
                              onChange={(e) =>
                                handleChange(
                                  index,
                                  "discountedPrice",
                                  e.target.value
                                )
                              }
                              className={`${tableInput}`}
                            />
                            {validationErrors[
                              `items.${index}.discountedPrice`
                            ] &&
                              formSubmitted && (
                                <p className="text-red-500">
                                  {
                                    validationErrors[
                                      `items.${index}.discountedPrice`
                                    ]
                                  }
                                </p>
                              )}
                            {!item.discountedPrice &&
                              formSubmitted &&
                              !validationErrors[
                                `items.${index}.discountedPrice`
                              ] && (
                                <p className="text-red-500">
                                  Discounted Price Required
                                </p>
                              )}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    {/* Footer to display totals */}
                    <tfoot className="bg-gray-100">
                      <tr>
                        <td colSpan={4} className="p-2 font-bold text-right">
                          Totals:
                        </td>
                        <td className="p-2 font-bold text-center border border-black">
                          {totalAmount.totalLabor}
                        </td>
                        <td className="p-2 font-bold text-center border border-black">
                          {totalAmount.totalSpotCash}
                        </td>
                        <td className="p-2 font-bold text-center border border-black">
                          {totalAmount.totalDiscountedPrice}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center mt-4">
              <hr className="w-full my-2 border-t-4 border-gray-400 border-dotted" />

              <div className="flex flex-row items-center gap-2 mt-2">
                {tableData.length > 1 && (
                  <span
                    className={`${buttonStyle} bg-pink flex items-center justify-center cursor-pointer hover:bg-white hover:border-4 hover:border-pink hover:text-pink`}
                    onClick={handleRemoveItem}
                  >
                    <MinusCircleIcon
                      className="w-5 h-5 mr-2"
                      aria-hidden="true"
                    />
                    Remove Item
                  </span>
                )}
                <span
                  className={`bg-yellow flex items-center cursor-pointer hover:bg-white hover:border-4 hover:border-yellow hover:text-yellow text-gray-950 max-w-md justify-center ${buttonStyle}`}
                  onClick={handleAddItem}
                >
                  <PlusCircleIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                  Add Item
                </span>
              </div>
            </div>
            <div className="flex flex-col justify-between md:flex-row">
              <div className="w-full max-w-md p-4">
                <p className="font-semibold">Attachments:</p>
                <input
                  id="file"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="w-full mt-2"
                />
              </div>
            </div>
            <div className="mt-10 mb-4 ml-5">
              <h3 className="mb-3 font-bold">Noted By:</h3>
              <ul className="flex flex-wrap gap-6">
                {" "}
                {/* Use gap instead of space-x */}
                {notedBy.map((user, index) => (
                  <li
                    className="relative flex flex-col items-center justify-center w-auto text-center"
                    key={index}
                  >
                    {" "}
                    {/* Adjust width as needed */}
                    <div className="relative flex flex-col items-center justify-center">
                      <p className="relative inline-block pt-6 font-medium text-center uppercase">
                        <span className="relative z-10 px-2">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-black"></span>
                      </p>
                      <p className="font-bold text-[12px] text-center">
                        {user.position}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mb-4 ml-5">
              <h3 className="mb-3 font-bold">Approved By:</h3>
              {approvedBy.length === 0 ? (
                <p className="text-gray-500 ">
                  Please select an approver!
                  <br />
                  <span className="text-sm italic">
                    Note: You can add approvers by clicking the 'Add Approver'
                    button above.
                  </span>
                </p>
              ) : (
                <ul className="flex flex-wrap gap-6">
                  {" "}
                  {/* Use gap instead of space-x */}
                  {approvedBy.map((user, index) => (
                    <li
                      className="relative flex flex-col items-center justify-center text-center"
                      key={index}
                    >
                      <div className="relative flex flex-col items-center justify-center">
                        <p className="relative inline-block pt-6 font-medium text-center uppercase">
                          <span className="relative z-10 px-2">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></span>
                        </p>
                        <p className="font-bold text-[12px] text-center">
                          {user.position}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex justify-center w-full pb-10 mt-20 space-x-3">
              <button
                className={`bg-[#0275d8] hover:bg-[#6fbcff] ${buttonStyle}`}
                type="submit"
                onClick={handleFormSubmit}
                disabled={loading}
              >
                <span className="text-white hover:text-black">
                  {loading ? "PLEASE WAIT..." : "CREATE REQUEST"}
                </span>
              </button>
            </div>
          </div>
          {showConfirmationModal && (
            <div className="fixed top-0 left-0 z-50 flex items-center justify-center w-full h-full bg-black bg-opacity-50">
              <div className="p-4 bg-white rounded-md">
                <p>Are you sure you want to submit the request?</p>
                <div className="flex justify-end mt-4">
                  <button
                    className="px-4 py-2 mr-2 font-bold text-gray-800 bg-gray-300 rounded hover:bg-gray-400"
                    onClick={handleCloseConfirmationModal}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 font-bold text-white rounded bg-primary hover:bg-primary-dark"
                    onClick={handleConfirmSubmit}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
      {showSuccessModal && (
        <RequestSuccessModal onClose={handleCloseSuccessModal} />
      )}
      <AddCustomModal
        modalIsOpen={isModalOpen}
        closeModal={closeModal}
        openCompleteModal={() => {}}
        entityType="Approver"
        initialNotedBy={notedBy}
        initialApprovedBy={approvedBy}
        refreshData={() => {}}
        handleAddCustomData={handleAddCustomData}
      />
    </div>
  );
};

export default CreateDiscount;
